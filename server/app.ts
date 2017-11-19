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
import { noCache } from './middleware/no-cache';
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
import { ClientStartupDataRoutes } from './routes/client-startup-data';
import { ClientDevicesStatusRoutes } from './routes/client-devices-status';
import { ClientDeviceCurrentDataRoutes } from './routes/client-device-current-data';
import { DevicesGroupsRoutes } from './routes/devices-groups';
import { ClientsGroupsRoutes } from './routes/clients-groups';
import { ClientsRoutes } from './routes/clients';
import { calcEngine } from './utils/calc-engine';
import { ReportsRoutes } from './routes/reports';
import { WebSocketServer } from './web-socket-server';
import { WebSocketActions } from './web-socket-actions';
import { WebSocketMessageName } from '../shared/web-socket-message-name';
import { ApplicationGroupsRoutes } from './routes/application-groups';
import { ApplicationProfilesRoutes } from './routes/application-profiles';
import { ApplicationProfilesFilesRoutes } from './routes/application-profiles-files';
import { IStartClientDeviceResult } from '../shared/interfaces/start-client-device-result';
import { IStopClientDeviceResult } from '../shared/interfaces/stop-client-device-result';
import { AdvancedSettingsRoutes } from './routes/advanced-settings';

export class App {
    private logger: Logger;
    private koa: Koa;
    private storageProvider: StorageProvider;
    private server: https.Server | http.Server;
    private calcEngine: typeof calcEngine;
    private tokenSecret: string;
    private wsServer: WebSocketServer;
    private webSocketActions: WebSocketActions;

    constructor(private options: IAppOptions) {
        this.calcEngine = calcEngine;
    }

    /**
     * Prepares storage (eventually updates it) and starts listening for connections
     * @param createStorage {boolean} If true, application will try to crete storage
     * @param appAdministratorPassword {string} If createStorage is true, must contain the password of storage administrator
     * for application administrator user which will be created as the first user
     */
    start(
        createStorage: boolean,
        appAdministratorPassword?: string | null
    ): Promise<https.Server | http.Server | null> {
        this.logger = new Logger(this.options.config.logging.filePath);
        return this.startImpl(createStorage, appAdministratorPassword);
    }

    private createKoa(tokenSecret: string): void {
        const apiPrefix = '/api/';
        this.koa = new Koa();

        const webFolder = path.join(__dirname, this.options.config.httpServer.webAppFolder);
        this.logger.log(`Serving from '${webFolder}'`);

        this.koa.use(requestLogger(this.logger));

        this.koa.use(koaStatic(webFolder));
        this.koa.use(notFound({ root: webFolder, serve: 'index.html', ignorePrefix: apiPrefix }));
        this.koa.use(bodyParser());

        this.koa.use(noCache());

        const clientStartupDataRoutes = new ClientStartupDataRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientStartupDataRoutes.getClientStartupData());

        const authRoutes = new AuthenticationRoutes(this.storageProvider, apiPrefix);
        this.koa.use(authRoutes.logInEmployee());
        this.koa.use(authRoutes.logInClientDevice());
        this.koa.use(authRoutes.logInClient());
        authRoutes.getClientLoggedInObservable().subscribe(clientLoggedInData => {
            if (!clientLoggedInData.logInClientResult
                || clientLoggedInData.logInClientResult.deviceAlreadyStarted
                || clientLoggedInData.logInClientResult.disabled) {
                return;
            }
            this.webSocketActions.sendToDevice(clientLoggedInData.deviceId, WebSocketMessageName.startDevice, null);
        });

        this.koa.use(requireToken({ secret: tokenSecret }));
        this.koa.use(authRoutes.checkAuthorization());

        // Everything below must be authenticated and authorized
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
        this.koa.use(clientDevicesRoutes.updateClientDevice());

        const clientDevicesStatesRoutes = new ClientDevicesStatusRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientDevicesStatesRoutes.getClientDevicesStatus());
        this.koa.use(clientDevicesStatesRoutes.startDevice());
        this.koa.use(clientDevicesStatesRoutes.stopDevice());
        clientDevicesStatesRoutes.getDeviceStartedObservable().subscribe(startDeviceData => {
            this.handleDeviceStarted(startDeviceData);
        });
        clientDevicesStatesRoutes.getDeviceStoppedObservable().subscribe(stopDeviceData => {
            this.handleDeviceStopped(stopDeviceData);
        });

        const clientDeviceCurrentDataRoutes = new ClientDeviceCurrentDataRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientDeviceCurrentDataRoutes.getClientDeviceCurrentData());
        this.koa.use(clientDeviceCurrentDataRoutes.getClientDevicePostStartData());

        const devicesGroupsRoutes = new DevicesGroupsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(devicesGroupsRoutes.getAllDevicesGroups());
        this.koa.use(devicesGroupsRoutes.updateDeviceGroup());
        this.koa.use(devicesGroupsRoutes.createDeviceGroup());

        const clientsGroupsRoutes = new ClientsGroupsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientsGroupsRoutes.getAllClientsGroups());
        this.koa.use(clientsGroupsRoutes.updateClientGroup());
        this.koa.use(clientsGroupsRoutes.createClientGroup());

        const clientsRoutes = new ClientsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(clientsRoutes.getAllClients());
        this.koa.use(clientsRoutes.createClient());
        this.koa.use(clientsRoutes.updateClient());
        this.koa.use(clientsRoutes.addClientCredit());

        const reportsRoutes = new ReportsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(reportsRoutes.getTotalsByClientDeviceAndEmployee());

        const applicationGroupsRoute = new ApplicationGroupsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(applicationGroupsRoute.getApplicationGroups());
        this.koa.use(applicationGroupsRoute.createApplicationGroup());
        this.koa.use(applicationGroupsRoute.updateApplicationGroup());

        const applicationProfilesRoutes = new ApplicationProfilesRoutes(this.storageProvider, apiPrefix);
        // this.koa.use(applicationProfilesRoutes.getApplicationProfilesWithFiles());
        this.koa.use(applicationProfilesRoutes.getApplicationProfiles());
        this.koa.use(applicationProfilesRoutes.createApplicationProfile());
        this.koa.use(applicationProfilesRoutes.updateApplicationProfile());

        const applicationProfilesFilesRoutes = new ApplicationProfilesFilesRoutes(this.storageProvider, apiPrefix);
        this.koa.use(applicationProfilesFilesRoutes.deleteFile());
        this.koa.use(applicationProfilesFilesRoutes.addFile());

        const advancedSettingsRoutes = new AdvancedSettingsRoutes(this.storageProvider, apiPrefix);
        this.koa.use(advancedSettingsRoutes.getSettings());
        this.koa.use(advancedSettingsRoutes.updateSetting());
    }

    private handleDeviceStarted(args: { deviceId: string; startResult: IStartClientDeviceResult | null }): void {
        if (!args.deviceId
            || !args.startResult
            || args.startResult.notEnoughCredit
            || !args.startResult.alreadyStartedInfo
            || args.startResult.alreadyStartedInfo.alreadyStarted
            || args.startResult.alreadyStartedInfo.clientAccountAlreadyInUse) {
            return;
        }
        this.webSocketActions.sendToDevice(args.deviceId, WebSocketMessageName.startDevice, null);
    }

    private handleDeviceStopped(args: { deviceId: string; stopResult: IStopClientDeviceResult }): void {
        if (!args.stopResult
            || args.stopResult.alreadyStopped
            || !args.deviceId) {
            return;
        }
        this.webSocketActions.sendToDevice(args.deviceId, WebSocketMessageName.stopDevice, null);
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
        result.startupName = 'SpotCafe.Desktop.exe';
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
        appAdministratorPassword?: string | null
    ): Promise<https.Server | http.Server | null> {
        if (createStorage && !appAdministratorPassword) {
            return Promise.reject('When store must be created, application administrator password must be supplied');
        }
        let prepareStorageResult = {
            createResult: <ICreateStorageResult | null>null,
            prepareResult: <IPrepareStorageResult | null>null
        };
        // Try multiple times to prepare storage
        // This could be useful if the application starts way sonner than the storage (database server)
        const delay = 5000;
        for (let i = 0; i < 100000; i++) {
            try {
                prepareStorageResult = await this.prepareStorage(createStorage, appAdministratorPassword);
                if (createStorage && prepareStorageResult.createResult && prepareStorageResult.createResult.storageInitialized) {
                    break;
                } else if (!createStorage && prepareStorageResult.prepareResult) {
                    break;
                } else {
                    await this.delay(delay);
                }
            } catch (err) {
                this.logger.log(err);
                await this.delay(delay);
            }
        }
        if (createStorage && !prepareStorageResult.createResult) {
            // Creating storage failed
            return null;
        }
        if (!createStorage && !prepareStorageResult.prepareResult) {
            // Preparing storage failed
            return null;
        }
        this.tokenSecret = (await this.storageProvider.getTokenSecret()) || '';
        await this.setClientFiles();
        await this.startCalcEngine();
        this.server = await this.startHttpServer();
        this.startWebSocketServer(this.server);
        await this.startDiscoveryListener();
        return this.server;
    }

    private startWebSocketServer(server: https.Server | http.Server): void {
        this.wsServer = new WebSocketServer(this.tokenSecret);
        this.wsServer.startServer(server);
        this.webSocketActions = new WebSocketActions(this.wsServer, this.storageProvider);
    }

    private async startCalcEngine(): Promise<void> {
        const billsCalcInterval = await this.getNumberSetting('bills.calculateInterval', 5);
        this.calcEngine.initialize({
            billsCalcInterval: billsCalcInterval * 1000,
            storageProvider: this.storageProvider,
            logger: this.logger
        });
        await calcEngine.execCalcBillsAndSetLastData();
        this.calcEngine.start();
    }

    private async getNumberSetting(name: string, defaultValue: number): Promise<number> {
        const settingValue = await this.storageProvider.getSetting(name);
        let result: number;
        if (settingValue) {
            result = parseInt(settingValue, 10);
        } else {
            result = defaultValue;
        }
        result = result || defaultValue;
        return result;
    }

    private async startHttpServer(): Promise<https.Server | http.Server> {
        this.logger.log('Starting HTTP server');
        const server = await this.startServer();
        const listenAddress = JSON.stringify(server.address());
        const listenProtocol = this.options.config.httpServer.secure ? 'HTTPS' : 'HTTP';
        this.logger.log(`${listenProtocol} listening at ${listenAddress}`);
        return server;
    }

    private async prepareStorage(
        createStorage: boolean,
        appAdministratorPassword?: string | null
    ): Promise<{ createResult: ICreateStorageResult | null, prepareResult: IPrepareStorageResult | null }> {
        this.logger.log('Creating storage provider');
        this.storageProvider = this.createStorageProvider();
        let prepareStorageResult: IPrepareStorageResult | null = null;
        let createStorageResult: ICreateStorageResult | null = null;
        try {
            if (createStorage && appAdministratorPassword) {
                // Create storage
                this.logger.log('Creating storage');
                createStorageResult = await this.storageProvider.createStorage(appAdministratorPassword);
                if (createStorageResult.errorOnStorageCreation) {
                    this.logger.log('The storage creation error occured. It can be ignored if the storage already exists.');
                    this.logger.log(createStorageResult.errorOnStorageCreation);
                }
                prepareStorageResult = createStorageResult.prepareStorageResult;
            } else {
                // Storage creation is not requested - only prepare it
                prepareStorageResult = await this.storageProvider.prepareStorage(appAdministratorPassword || '');
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
        this.createKoa(this.tokenSecret);

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
