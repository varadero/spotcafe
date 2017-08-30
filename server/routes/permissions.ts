import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IPermission } from '../shared/interfaces/permission';

export class PermissionsRoutes {
    constructor(private dataProvider: DatabaseProvider) {
    }

    getAllPermissionsRoute(): any {
        return route.get('/api/permissions', this.getAllPermissions.bind(this));
    }

    private async getAllPermissions(ctx: Koa.Context, next: () => Promise<any>): Promise<IPermission[]> {
        const permissions = await this.dataProvider.getAllPermissions();
        ctx.body = permissions;
        return permissions;
    }
}
