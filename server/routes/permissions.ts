import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { RoutesBase } from './routes-base';

export class PermissionsRoutes extends RoutesBase {
    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
        super();
    }

    getAllPermissions(): any {
        return route.get(this.apiPrefix + 'permissions', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.getPermissions());
        });
    }
}
