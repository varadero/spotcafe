import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IServerToken } from './interfaces/server-token';
import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { ICreateEmployeeResult } from '../../shared/interfaces/create-employee-result';

export class EmployeesRoutes extends RoutesBase {

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
        super();
    }

    createEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees-with-roles', async ctx => {
            await this.handleActionResult(ctx, () => this.createEmployeeWithRolesImpl(ctx.request.body));
        });
    }

    getEmployeesWithRoles(): any {
        return route.get(this.apiPrefix + 'employees-with-roles', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.getEmployeesWithRoles());
        });
    }

    updateEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateEmployeeWithRolesImpl(ctx.request.body, ctx.state.token));
        });
    }

    private async createEmployeeWithRolesImpl(
        employeeWithRoles: IEmployeeWithRoles
    ): Promise<IRouteActionResult<ICreateEmployeeResult> | void> {
        if (employeeWithRoles.employee.password.length < 6) {
            return { error: { message: 'Password length must be at least 6 characters', number: 400 } };
        }
        employeeWithRoles.employee.username = employeeWithRoles.employee.username.trim();
        if (!employeeWithRoles.employee.username) {
            return { error: { message: 'User name is required', number: 400 } };
        }
        const createdEmployeeResult = await this.dataProvider.createEmployeeWithRoles(employeeWithRoles);
        return { value: createdEmployeeResult };
    }

    private async updateEmployeeWithRolesImpl(
        employeeWithRoles: IEmployeeWithRoles,
        serverToken: IServerToken
    ): Promise<IRouteActionResult<any> | void> {
        if (employeeWithRoles.employee.disabled && employeeWithRoles.employee.id.toUpperCase() === serverToken.accountId.toUpperCase()) {
            return { error: { message: 'Can\'t disable own account', number: 403 } };
        }
        await this.dataProvider.updateEmployeeWithRoles(employeeWithRoles);
    }
}
