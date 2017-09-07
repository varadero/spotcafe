import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IPermission } from '../../shared/interfaces/permission';

export class PermissionsRoutes {
    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    getAllPermissions(): any {
        return route.get(this.apiPrefix + 'permissions', this.getAllPermissionsImpl.bind(this));
    }

    private async getAllPermissionsImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<IPermission[]> {
        const permissions = await this.dataProvider.getPermissions();
        ctx.body = permissions;
        return permissions;
    }
}
