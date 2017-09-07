import * as https from 'https';
import * as http from 'http';
import * as path from 'path';
import * as Koa from 'koa';
import * as koaStatic from 'koa-static';
import * as bodyParser from 'koa-bodyparser';

import { UdpDiscoveryListener } from './udp-discovery-listener';
import { notFound } from './middleware/not-found';
import { requireToken } from './middleware/require-token';
import { DatabaseProvider } from './database-provider/database-provider';
import { DatabaseProviderHelper } from './database-provider/database-provider-helper';
import { Logger } from './utils/logger';
import { IAppConfig } from './config/config';
import { IDatabaseConfig } from './config/database';
import { IPrepareDatabaseResult } from './database-provider/prepare-database-result';
import { AuthenticationRoutes } from './routes/authentication';
import { PermissionsRoutes } from './routes/permissions';
import { ICreateDatabaseResult } from './database-provider/create-database-result';
import { EmployeesRoutes } from './routes/employees';
import { RolesRoutes } from './routes/roles';
import { ClientDevicesRoutes } from './routes/client-devices';

export class App {
    private logger = new Logger();
    private koa: Koa;
    private dbProvider: DatabaseProvider;
    private server: https.Server | http.Server;

    constructor(private options: IAppOptions) { }

    /**
     * Prepares database (eventually updates it) and starts listening for connections
     * @param createDatabase {boolean} If true, application will try to crete database
     * @param administratorPassword {string} If createDatabase is true, must contain the password
     * for application administrator user which will be created as the first user
     */
    start(createDatabase: boolean, administratorPassword?: string | null): Promise<https.Server | http.Server | null> {
        return this.startImpl(createDatabase, administratorPassword);
    }

    private createKoa(tokenSecret: string | null): void {
        const apiPrefix = '/api/';
        this.koa = new Koa();

        const webFolder = path.join(__dirname, this.options.config.httpServer.webAppFolder);
        this.logger.log(`Serving from '${webFolder}'`);
        this.koa.use(koaStatic(webFolder));
        this.koa.use(notFound({ root: webFolder, serve: 'index.html', ignorePrefix: apiPrefix }));
        this.koa.use(bodyParser());

        const authRoutes = new AuthenticationRoutes(this.dbProvider, apiPrefix);
        this.koa.use(authRoutes.logInEmployee());

        this.koa.use(requireToken({ secret: tokenSecret || '' }));
        this.koa.use(authRoutes.checkAuthorization());

        const employeesRoutes = new EmployeesRoutes(this.dbProvider, apiPrefix);
        this.koa.use(employeesRoutes.getEmployeeWithRolesAndPermissions());
        this.koa.use(employeesRoutes.updateEmployeeWithRoles());
        this.koa.use(employeesRoutes.getEmployeesWithRoles());
        this.koa.use(employeesRoutes.createEmployeeWithRoles());

        const rolesRoute = new RolesRoutes(this.dbProvider, apiPrefix);
        this.koa.use(rolesRoute.getAllRoles());

        const permissionsRoutes = new PermissionsRoutes(this.dbProvider, apiPrefix);
        this.koa.use(permissionsRoutes.getAllPermissions());

        const clientDevicesRoutes = new ClientDevicesRoutes(this.dbProvider, apiPrefix);
        this.koa.use(clientDevicesRoutes.getClientDevices());
        this.koa.use(clientDevicesRoutes.approveClientDevice());
    }

    private startDiscoveryListener(): void {
        const listener = new UdpDiscoveryListener(this.dbProvider, this.logger);
        listener.listen();
    }

    private createDatabaseProvider(): DatabaseProvider {
        const dbHelper = new DatabaseProviderHelper();
        return dbHelper.getProvider(this.options.databaseConfig, this.logger);
    }

    private async startImpl(
        createDatabase: boolean,
        administratorPassword?: string | null
    ): Promise<https.Server | http.Server | null> {
        if (createDatabase && !administratorPassword) {
            return Promise.reject('When database must be created, application administrator password must be supplied');
        }

        await this.prepareDatabase(createDatabase, administratorPassword);
        if (createDatabase) {
            // Creating database will not start the server
            return null;
        }
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

    private async prepareDatabase(
        createDatabase: boolean,
        administratorPassword?: string | null
    ): Promise<{ createDb: ICreateDatabaseResult | null, prepare: IPrepareDatabaseResult | null }> {
        this.logger.log('Creating database provider');
        this.dbProvider = this.createDatabaseProvider();
        const numberOfRetries = 1000000;
        const delayBetweenRetries = 5000;
        let prepareDbResult: IPrepareDatabaseResult | null = null;
        let createDbResult: ICreateDatabaseResult | null = null;
        for (let i = 0; i < numberOfRetries; i++) {
            try {
                if (createDatabase && administratorPassword) {
                    // Create database
                    this.logger.log('Creating database');
                    createDbResult = await this.dbProvider.createDatabase(administratorPassword);
                    if (createDbResult.errorOnDatabaseCreation) {
                        this.logger.log('The database creation error occured. It can be ignored if the database already exists.');
                        this.logger.log(createDbResult.errorOnDatabaseCreation);
                    }
                    prepareDbResult = createDbResult.prepareDatabaseResult;
                } else {
                    // Database creation is not requested - only prepare it
                    prepareDbResult = await this.dbProvider.prepareDatabase();
                }
                break;
            } catch (err) {
                this.logger.error('Database error. Trying again.');
                this.logger.error(err);
                await this.delay(delayBetweenRetries);
            }
        }
        if (prepareDbResult) {
            this.logger.log('Database prepared');
            this.logger.log(`Server: ${prepareDbResult.server}`);
            this.logger.log(`Database: ${prepareDbResult.database}`);
            this.logger.log(`Database user name: ${prepareDbResult.userName}`);
            this.logger.log(`Update script files processed: ${prepareDbResult.updateScriptFilesProcessed}`);
        }
        if (createDatabase) {
            if (createDbResult && createDbResult.databaseInitialized) {
                this.logger.log('Database creation finished');
            }
        }
        return { createDb: createDbResult, prepare: prepareDbResult };
    }

    private async startServer(): Promise<https.Server | http.Server> {
        const tokenSecret = await this.dbProvider.getTokenSecret();
        this.createKoa(tokenSecret);

        let result: Promise<https.Server | http.Server>;
        if (this.options.config.httpServer.secure) {
            const httpsServerOptions = <https.ServerOptions>{
                key: this.options.key,
                cert: this.options.cert

            };

            result = new Promise<https.Server>((resolve, reject) => {
                const server = https.createServer(httpsServerOptions, this.koa.callback())
                    .listen(this.options.config.httpServer.port, this.options.config.httpServer.host, () => {
                        resolve(<https.Server>server);
                    });
            });
        } else {
            result = new Promise<https.Server>((resolve, reject) => {
                const server = http.createServer(this.koa.callback())
                    .listen(this.options.config.httpServer.port, this.options.config.httpServer.host, () => {
                        resolve(<any>server);
                    });
            });
        }
        return result;
    }

    private delay(ms: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => resolve(), ms);
        });
    }
}

export interface IAppOptions {
    config: IAppConfig;
    databaseConfig: IDatabaseConfig;
    key: any;
    cert: any;
}
