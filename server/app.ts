import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import * as Koa from 'koa';
import * as koaStatic from 'koa-static';
import * as bodyParser from 'koa-bodyparser';

import { UdpDiscoveryListener } from './udp-discovery-listener';
import { notFound } from './middleware/not-found';
import { requireToken } from './middleware/require-token';
import { requestLogger } from './middleware/request-logger';
import { redirectToHttps } from './middleware/redirect-to-https';
import { StorageProvider } from './storage/storage-provider';
import { StorageProviderHelper } from './storage/storage-provider-helper';
import { Logger } from './utils/logger';
import { IAppConfig } from './config/config-interfaces';
import { IStorageConfig } from './config/storage-interfaces';
import { IPrepareStorageResult } from './storage/prepare-storage-result';
import { AuthenticationRoutes } from './routes/authentication';
import { PermissionsRoutes } from './routes/permissions';
import { ICreateStorageResult } from './storage/create-storage-result';
import { EmployeesRoutes } from './routes/employees';
import { RolesRoutes } from './routes/roles';
import { ClientDevicesRoutes } from './routes/client-devices';
import { IClientFilesData } from './storage/client-files-data';
import { ClientFilesRoutes } from './routes/client-files';
import { ClientDevicesStatusRoutes } from './routes/client-devices-status';

export class App {
    private logger = new Logger();
    private koa: Koa;
    private storageProvider: StorageProvider;
    private server: https.Server | http.Server;

    constructor(private options: IAppOptions) { }

    /**
     * Prepares storage (eventually updates it) and starts listening for connections
     * @param createStorage {boolean} If true, application will try to crete storage
     * @param administratorPassword {string} If createStorage is true, must contain the password
     * for application administrator user which will be created as the first user
     */
    start(createStorage: boolean, administratorPassword?: string | null): Promise<https.Server | http.Server | null> {
        return this.startImpl(createStorage, administratorPassword);
    }

    private createKoa(tokenSecret: string | null): void {
        const apiPrefix = '/api/';
        this.koa = new Koa();

        const webFolder = path.join(__dirname, this.options.config.httpServer.webAppFolder);
        this.logger.log(`Serving from '${webFolder}'`);

        this.koa.use(requestLogger(this.logger));

        this.koa.use(koaStatic(webFolder));
        this.koa.use(notFound({ root: webFolder, serve: 'index.html', ignorePrefix: apiPrefix }));
        this.koa.use(bodyParser());

        const clientFilesRouts = new ClientFilesRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientFilesRouts.getClientFiles());

        const authRoutes = new AuthenticationRoutes(this.storageProvider, apiPrefix);
        this.koa.use(authRoutes.logInEmployee());

        this.koa.use(requireToken({ secret: tokenSecret || '' }));
        this.koa.use(authRoutes.checkAuthorization());

        const employeesRoutes = new EmployeesRoutes(this.storageProvider, apiPrefix);
        this.koa.use(employeesRoutes.updateEmployeeWithRoles());
        this.koa.use(employeesRoutes.getEmployeesWithRoles());
        this.koa.use(employeesRoutes.createEmployeeWithRoles());

        const rolesRoutes = new RolesRoutes(this.storageProvider, apiPrefix);
        this.koa.use(rolesRoutes.getAllRoles());
        this.koa.use(rolesRoutes.getAllRolesWithPermissionIds());
        this.koa.use(rolesRoutes.updateRoleWithPermissionsIds());
        this.koa.use(rolesRoutes.createRoleWithPermissionsIds());

        const permissionsRoutes = new PermissionsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(permissionsRoutes.getAllPermissions());

        const clientDevicesRoutes = new ClientDevicesRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientDevicesRoutes.getClientDevices());
        this.koa.use(clientDevicesRoutes.approveClientDevice());
        this.koa.use(clientDevicesRoutes.updateClientDevice());

        const clientDevicesStatesRoutes = new ClientDevicesStatusRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientDevicesStatesRoutes.getClientDevicesStatus());
    }

    /**
     * Reads all files in 'client-files' folder and saves them in storage setting 'client.files'
     * This setting will be delivered to windows service on startup to create client files locally on windows machines and start desktop app
     * Specified in 'startupName'. If not secified, the default file name 'SpotCafe.Desktop.exe' will be used
     */
    private async setClientFiles(): Promise<void> {
        const result: IClientFilesData = <IClientFilesData>{
            files: [],
            startupName: ''
        };
        const dir = path.join(__dirname, 'client-files');
        if (!fs.existsSync(dir)) {
            return Promise.resolve(void 0);
        }
        if (!fs.statSync(dir).isDirectory()) {
            return Promise.resolve(void 0);
        }
        const clientFiles = fs.readdirSync(dir);
        for (let i = 0; i < clientFiles.length; i++) {
            if (!clientFiles[i].endsWith('.zip')) {
                let msg = `The client file '${path.join(dir, clientFiles[i])}' is not .zip.`;
                msg += ` All files in '${dir}' folder must be .zip,`;
                msg += ' otherwise none of the client files will be available for the client machines';
                this.logger.error(msg);
                break;
            }
        }

        for (let i = 0; i < clientFiles.length; i++) {
            const fileName = clientFiles[i];
            const filePath = path.join(dir, fileName);
            if (fs.statSync(filePath).isFile()) {
                const base64 = fs.readFileSync(filePath).toString('base64');
                result.files.push({ name: fileName, base64Content: base64 });
            }
        }
        if (result.files.length > 0) {
            await this.storageProvider.setClientFiles(result);
        } else {
            return Promise.resolve(void 0);
        }
    }

    private startDiscoveryListener(): void {
        const listener = new UdpDiscoveryListener(this.storageProvider, this.logger);
        listener.listen();
    }

    private createStorageProvider(): StorageProvider {
        const storageHelper = new StorageProviderHelper();
        return storageHelper.getProvider(this.options.storageConfig, this.logger);
    }

    private async startImpl(
        createStorage: boolean,
        administratorPassword?: string | null
    ): Promise<https.Server | http.Server | null> {
        if (createStorage && !administratorPassword) {
            return Promise.reject('When store must be created, application administrator password must be supplied');
        }
        let prepareStorageResult = {
            createResult: <ICreateStorageResult | null>null,
            prepareResult: <IPrepareStorageResult | null>null
        };
        // Try multiple times to prepare storage
        // This could be useful if the application starts way sonner than the storage (database server)
        for (let i = 0; i < 100000; i++) {
            try {
                prepareStorageResult = await this.prepareStorage(createStorage, administratorPassword);
                if (prepareStorageResult.prepareResult) {
                    break;
                }
            } catch (err) {
                await this.delay(5000);
            }
        }
        if (createStorage) {
            // Creating storage will not start the server
            return null;
        }
        if (!prepareStorageResult.prepareResult) {
            // Can't prepare storage
            return null;
        }
        await this.setClientFiles();
        this.server = await this.startWebServer();
        await this.startDiscoveryListener();
        return this.server;
    }

    private async startWebServer(): Promise<https.Server | http.Server> {
        this.logger.log('Starting web server');
        const server = await this.startServer();
        const listenAddress = JSON.stringify(server.address());
        const listenProtocol = this.options.config.httpServer.secure ? 'HTTPS' : 'HTTP';
        this.logger.log(`${listenProtocol} listening at ${listenAddress}`);
        return server;
    }

    private async prepareStorage(
        createStorage: boolean,
        administratorPassword?: string | null
    ): Promise<{ createResult: ICreateStorageResult | null, prepareResult: IPrepareStorageResult | null }> {
        this.logger.log('Creating storage provider');
        this.storageProvider = this.createStorageProvider();
        let prepareStorageResult: IPrepareStorageResult | null = null;
        let createStorageResult: ICreateStorageResult | null = null;
        try {
            if (createStorage && administratorPassword) {
                // Create storage
                this.logger.log('Creating storage');
                createStorageResult = await this.storageProvider.createStorage(administratorPassword);
                if (createStorageResult.errorOnStorageCreation) {
                    this.logger.log('The storage creation error occured. It can be ignored if the storage already exists.');
                    this.logger.log(createStorageResult.errorOnStorageCreation);
                }
                prepareStorageResult = createStorageResult.prepareStorageResult;
            } else {
                // Storage creation is not requested - only prepare it
                prepareStorageResult = await this.storageProvider.prepareStorage();
            }
        } catch (err) {
            this.logger.error('Storage error.');
            this.logger.error(err);
        }
        if (prepareStorageResult) {
            this.logger.log('Storage prepared');
            this.logger.log(`Server: ${prepareStorageResult.server}`);
            this.logger.log(`Storage: ${prepareStorageResult.storage}`);
            this.logger.log(`Storage user name: ${prepareStorageResult.userName}`);
            this.logger.log(`Update script files processed: ${prepareStorageResult.updateScriptFilesProcessed}`);
        }
        if (createStorage) {
            if (createStorageResult && createStorageResult.storageInitialized) {
                this.logger.log('Storage creation finished');
            }
        }
        return { createResult: createStorageResult, prepareResult: prepareStorageResult };
    }

    private async startServer(): Promise<https.Server | http.Server> {
        const tokenSecret = await this.storageProvider.getTokenSecret();
        this.createKoa(tokenSecret);

        let result: Promise<https.Server | http.Server>;
        const httpConf = this.options.config.httpServer;
        if (httpConf.secure) {
            if (httpConf.redirectHttpToHttps) {
                http.createServer(redirectToHttps(httpConf.port)).listen(80, httpConf.host);
            }

            const httpsServerOptions = <https.ServerOptions>{
                key: this.options.key,
                cert: this.options.cert

            };

            result = new Promise<https.Server>(resolve => {
                const server = https.createServer(httpsServerOptions, this.koa.callback())
                    .listen(httpConf.port, httpConf.host, () => {
                        resolve(<https.Server>server);
                    });
            });
        } else {
            result = new Promise<https.Server>(resolve => {
                const server = http.createServer(this.koa.callback())
                    .listen(httpConf.port, httpConf.host, () => {
                        resolve(<any>server);
                    });
            });
        }
        return result;
    }

    private delay(ms: number): Promise<void> {
        return new Promise<void>(resolve => {
            setTimeout(() => resolve(), ms);
        });
    }
}

export interface IAppOptions {
    config: IAppConfig;
    storageConfig: IStorageConfig;
    key: any;
    cert: any;
}
