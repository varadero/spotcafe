import * as Koa from 'koa';
import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IServerToken } from './interfaces/server-token';
import { ErrorMessage } from '../utils/error-message';
import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';

export class EmployeesRoutes {
    private errorMessage = new ErrorMessage();

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    createEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees-with-roles', this.createEmployeeWithRolesImpl.bind(this));
    }

    getEmployeesWithRoles(): any {
        return route.get(this.apiPrefix + 'employees-with-roles', this.getEmployeesWithRolesImpl.bind(this));
    }

    updateEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees/:id', this.updateEmployeeWithRolesImpl.bind(this));
    }

    getEmployeeWithRolesAndPermissions(): any {
        return route.get(this.apiPrefix + 'employee-with-permission', this.getEmployeeWithRolesAndPermissionsImpl.bind(this));
    }

    private async createEmployeeWithRolesImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<string> {
        const employeeWithRoles = <IEmployeeWithRoles>ctx.request.body;
        if (employeeWithRoles.employee.password.length < 6) {
            return ctx.throw(this.errorMessage.create('Password length must be at least 6 characters'), 400);
        }
        employeeWithRoles.employee.username = employeeWithRoles.employee.username.trim();
        if (!employeeWithRoles.employee.username) {
            return ctx.throw(this.errorMessage.create('User name is required'), 400);
        }
        const createdEmployeeId = await this.dataProvider.createEmployeeWithRoles(employeeWithRoles);
        ctx.body = { createdEmployeeId: createdEmployeeId };
        return createdEmployeeId;
    }

    private async getEmployeesWithRolesImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<IEmployeeWithRoles[]> {
        const employeeIdWithRoles = await this.dataProvider.getEmployeesWithRoles();
        ctx.body = employeeIdWithRoles;
        return employeeIdWithRoles;
    }

    private async updateEmployeeWithRolesImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const employeeWithRoles = <IEmployeeWithRoles>ctx.request.body;
        // Don't allow setting disabled=true for your own user
        const serverToken = <IServerToken>ctx.state.token;
        if (employeeWithRoles.employee.disabled && employeeWithRoles.employee.id.toUpperCase() === serverToken.accountId.toUpperCase()) {
            return ctx.throw(this.errorMessage.create('Can\'t disable own account'), 403);
        }
        await this.dataProvider.updateEmployeeWithRoles(employeeWithRoles);
        ctx.status = 200;
    }

    private async getEmployeeWithRolesAndPermissionsImpl(
        ctx: Koa.Context,
        next: () => Promise<any>
    ): Promise<IEmployeeWithRolesAndPermissions> {
        const credentials = <{ username: string, password: string }>ctx.request.body;
        const userWithPermissions = await this.dataProvider.getEmployeeWithRolesAndPermissions(credentials.username, credentials.password);
        return userWithPermissions;
    }
}
