import * as route from 'koa-route';

import { RoutesBase } from './routes-base';
import { StorageProvider } from '../storage/storage-provider';

export class ClientStartupDataRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientStartupData(): any {
        return route.get(this.apiPrefix + 'client-startup-data', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClientStartupData());
        });
    }
}
