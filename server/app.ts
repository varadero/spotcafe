import * as https from 'https';
import * as Koa from 'koa';

import { DatabaseProvider } from './database-provider/database-provider';
import { DatabaseProviderHelper } from './database-provider/database-provider-helper';
import { Logger } from './utils/logger';
import { IAppConfig } from './config/config';
import { IDatabaseConfig } from './config/database';
import { IPrepareDatabaseResult } from './database-provider/prepare-database-result';
export class App {
    private logger = new Logger();
    private koa: Koa;
    private dbProvider: DatabaseProvider;
    private server: https.Server;

    constructor(private options: IAppOptions) { }

    /**
     * Prepares database (eventually updates it) and starts listening for connections
     * @param createDatabase {boolean} If true, application will try to crete database
     */
    async start(createDatabase: boolean): Promise<https.Server> {
        this.logger.log('Creating database provider');
        this.dbProvider = this.getProvider();
        this.logger.log('Preparing the database');
        const numberOfRetries = 1000000;
        const delayBetweenRetries = 5000;
        let prepareDbResult: IPrepareDatabaseResult | null = null;
        for (let i = 0; i < numberOfRetries; i++) {
            try {
                if (createDatabase) {
                    // Creating database - this will also prepare it
                    this.logger.log('Creating database');
                    const createDbResult = await this.dbProvider.createDatabase();
                    if (createDbResult.errorOnDatabaseCreation) {
                        this.logger.log('The database creation error occured. It can be ignored if the database already existed.');
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
            this.logger.log(`User name: ${prepareDbResult.userName}`);
            this.logger.log(`Update script files processed: ${prepareDbResult.updateScriptFilesProcessed}`);
        }
        this.logger.log('Starting HTTP server');
        this.server = await this.startServer();
        this.logger.log(`Listening at ${JSON.stringify(this.server.address())}`);
        return this.server;
    }

    private getProvider(): DatabaseProvider {
        const dbHelper = new DatabaseProviderHelper();
        return dbHelper.getProvider(this.options.databaseConfig);
    }

    private async startServer(): Promise<https.Server> {
        this.koa = new Koa();

        const options = <https.ServerOptions>{
            key: this.options.key,
            cert: this.options.cert

        };
        const result = new Promise<https.Server>((resolve, reject) => {
            const server = https.createServer(options, this.koa.callback())
                .listen(this.options.config.httpServer.port, this.options.config.httpServer.host, () => {
                    resolve(<https.Server>server);
                });
        });

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




// function startServer() {
//     app =
// }

// import { IConnectionData } from './config/connection-data';
// import { DatabaseProvider } from './database-provider/database-provider';

// const connData = <IConnectionData>JSON.parse(fs.readFileSync('./connection-data.json', { encoding: 'utf8' }));

// const connection = new Connection(connData.config);

// connection.on('connect', err => {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log('Connected');
//     }
// });
