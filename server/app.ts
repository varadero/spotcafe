import * as https from 'https';
import * as http from 'http';
import * as Koa from 'koa';
import * as koaStatic from 'koa-static';
import * as bodyParser from 'koa-bodyparser';

import { notFound } from './middleware/not-found';
import { requireToken } from './middleware/require-token';
import { DatabaseProvider } from './database-provider/database-provider';
import { DatabaseProviderHelper } from './database-provider/database-provider-helper';
import { Logger } from './utils/logger';
import { IAppConfig } from './config/config';
import { IDatabaseConfig } from './config/database';
import { IPrepareDatabaseResult } from './database-provider/prepare-database-result';
import { AuthRoutes } from './routes/auth';
import { PermissionsRoutes } from './routes/permissions';
import { ICreateDatabaseResult } from './database-provider/create-database-result';

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

    private createKoa(tokenSecret: string | null) {
        this.koa = new Koa();

        this.koa.use(koaStatic(this.options.config.httpServer.webAppFolder));
        this.koa.use(notFound({ root: this.options.config.httpServer.webAppFolder, serve: 'index.html', ignorePrefix: '/api/' }));
        this.koa.use(bodyParser());

        const authRoutes = new AuthRoutes(this.dbProvider);
        this.koa.use(authRoutes.logInEmployee());

        this.koa.use(requireToken({ secret: tokenSecret || '' }));

        const permissionsRoutes = new PermissionsRoutes(this.dbProvider);
        this.koa.use(permissionsRoutes.getAllPermissionsRoute());
    }

    private getProvider(): DatabaseProvider {
        const dbHelper = new DatabaseProviderHelper();
        return dbHelper.getProvider(this.options.databaseConfig);
    }

    private async startImpl(createDatabase: boolean, administratorPassword?: string | null): Promise<https.Server | http.Server | null> {
        if (createDatabase && !administratorPassword) {
            return Promise.reject('When database must be created, administrator password must be supplied');
        }

        this.logger.log('Creating database provider');
        this.dbProvider = this.getProvider();
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
            // Creating database will not start the server
            if (createDbResult && createDbResult.databaseInitialized) {
                this.logger.log('Database was created');
            }
            return null;
        }
        this.logger.log('Starting HTTP server');
        this.server = await this.startServer();
        const listenAddress = JSON.stringify(this.server.address());
        const listenProtocol = this.options.config.httpServer.secure ? 'HTTPS' : 'HTTP';
        this.logger.log(`${listenProtocol} listening at ${listenAddress}`);
        return this.server;
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
