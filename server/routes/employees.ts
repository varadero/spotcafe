import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IEmployee } from '../../shared/interfaces/employee';

export class EmployeesRoutes {
    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    getAllEmployees(): any {
        return route.get(this.apiPrefix + 'employees', this.getEmployees.bind(this));
    }

    getEmployeeWithRolesAndPermissions(): any {
        return route.get(this.apiPrefix + 'employee-with-permission', this.getEmployeeWithPermissions.bind(this));
    }

    private async getEmployees(ctx: Koa.Context, next: () => Promise<any>): Promise<IEmployee[]> {
        const employees = await this.dataProvider.getEmployees();
        ctx.body = employees;
        return employees;
    }

    private async getEmployeeWithPermissions(ctx: Koa.Context, next: () => Promise<any>): Promise<IEmployeeWithRolesAndPermissions> {
        const credentials = <{ username: string, password: string }>ctx.request.body;
        const userWithPermissions = await this.dataProvider.getEmployeeWithRolesAndPermissions(credentials.username, credentials.password);
        return userWithPermissions;
    }
}
