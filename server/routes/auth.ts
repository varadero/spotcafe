import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';

export class AuthRoutes {
    constructor(private dataProvider: DatabaseProvider) {
    }

    logInEmployee(): any {
        return route.post('/api/loginEmployee', this.getEmployeeWithPermissions.bind(this));
    }

    private async getEmployeeWithPermissions(ctx: Koa.Context, next: () => Promise<any>): Promise<IEmployeeWithRolesAndPermissions> {
        const credentials = <{ username: string, password: string }>ctx.request.body;
        const userWithPermissions = await this.dataProvider.getEmployeeWithRolesAndPermissions(credentials.username, credentials.password);
        if (!userWithPermissions.employee) {
            // User was not found
            return ctx.throw('Invalid credentials', 401);
        }
        ctx.body = userWithPermissions;
        return userWithPermissions;
    }
}
