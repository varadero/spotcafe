import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IEmployee } from '../../shared/interfaces/employee';
import { IServerToken } from './interfaces/server-token';
import { ErrorMessage } from '../utils/error-message';

export class EmployeesRoutes {
    private errorMessage = new ErrorMessage();

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    getAllEmployees(): any {
        return route.get(this.apiPrefix + 'employees', this.getEmployees.bind(this));
    }

    updateEmployee(): any {
        return route.post(this.apiPrefix + 'employees/:id', this.updateEmployeeImpl.bind(this));
    }

    getEmployeeWithRolesAndPermissions(): any {
        return route.get(this.apiPrefix + 'employee-with-permission', this.getEmployeeWithPermissions.bind(this));
    }

    private async updateEmployeeImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const employee = <IEmployee>ctx.request.body;
        // Don't allow setting disabled=true for your own user
        const serverToken = <IServerToken>ctx.state.token;
        if (employee.disabled && employee.id.toUpperCase() === serverToken.accountId.toUpperCase()) {
            return ctx.throw(this.errorMessage.create('Can\'t disable own account'), 403);
        }
        await this.dataProvider.updateEmployee(employee);
        ctx.status = 200;
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
