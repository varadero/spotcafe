import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class PermissionsRoutes extends RoutesBase {
    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getAllPermissions(): any {
        return route.get(this.apiPrefix + 'permissions', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getPermissions());
        });
    }
}
