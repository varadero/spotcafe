import * as fs from 'fs';
import * as path from 'path';

import { App, IAppOptions } from './app';
import { IDatabaseConfig } from './config/database';
import { IAppConfig } from './config/config';

const appConfig = loadConfig<IAppConfig>('app.json');
const databaseConfig = loadConfig<IDatabaseConfig>('database.json');

const appOptions = <IAppOptions>{
    config: appConfig,
    databaseConfig: databaseConfig,
    cert: fs.readFileSync(getConfigFilePath('cert.pem')),
    key: fs.readFileSync(getConfigFilePath('key.pem'))
};

(async function () {
    try {
        const app = new App(appOptions);
        const createDatabase = process.argv.includes('--create-database');
        const administratorPasswordArg = process.argv.find(x => x.startsWith('--administrator-password='));
        const administratorPassword = administratorPasswordArg ?
            administratorPasswordArg.substr(administratorPasswordArg.indexOf('=') + 1)
            : null;
        const server = await app.start(createDatabase, administratorPassword);
        if (server) {
            console.log(`${new Date().toISOString()}: App started`);
        }
    } catch (err) {
        console.error(err);
    }
})();

function loadConfig<T>(fileName: string): T {
    const result = <T>JSON.parse(fs.readFileSync(getConfigFilePath(fileName), { encoding: 'utf8' }));
    return result;
}

function getConfigFilePath(fileName: string): string {
    return path.join(__dirname, './config', fileName);
}
