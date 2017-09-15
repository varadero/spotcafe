import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class RolesRoutes extends RoutesBase {
    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getAllRoles(): any {
        return route.get(this.apiPrefix + 'roles', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getRoles());
        });
    }
}
