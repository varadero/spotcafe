import * as route from 'koa-route';

import { RoutesBase } from './routes-base';
import { StorageProvider } from '../storage/storage-provider';

export class ClientFilesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientFiles(): any {
        return route.get(this.apiPrefix + 'client-files', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClientDevices());
        });
    }
}
