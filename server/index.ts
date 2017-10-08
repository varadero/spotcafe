import * as fs from 'fs';
import * as path from 'path';

import { App, IAppOptions } from './app';
import { IStorageConfig } from './config/storage-interfaces';
import { IAppConfig } from './config/config-interfaces';

const appConfig = loadConfig<IAppConfig>('app.json');
const storageConfig = loadConfig<IStorageConfig>('storage.json');

const appOptions = <IAppOptions>{
    config: appConfig,
    storageConfig: storageConfig,
    cert: fs.readFileSync(getConfigFilePath('cert.pem')),
    key: fs.readFileSync(getConfigFilePath('key.pem'))
};

(async function () {
    try {
        const app = new App(appOptions);
        if (app) { }
        const createStorage = process.argv.includes('--create-storage');
        const appAdministratorPasswordArg = process.argv.find(x => x.startsWith('--app-administrator-password='));
        const appAdministratorPassword = appAdministratorPasswordArg ?
            appAdministratorPasswordArg.substr(appAdministratorPasswordArg.indexOf('=') + 1)
            : null;
        const server = await app.start(createStorage, appAdministratorPassword);
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
