import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IRole } from '../../shared/interfaces/role';


export class RolesRoutes {
    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    getAllRoles(): any {
        return route.get(this.apiPrefix + 'roles', this.getAllRolesImpl.bind(this));
    }

    private async getAllRolesImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<IRole[]> {
        const roles = await this.dataProvider.getAllRoles();
        ctx.body = roles;
        return roles;
    }
}
