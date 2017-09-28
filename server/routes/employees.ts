import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { IServerToken } from './interfaces/server-token';
import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { ICreateEmployeeResult } from '../../shared/interfaces/create-employee-result';
import { PermissionsMapper } from '../utils/permissions-mapper';

export class EmployeesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    createEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees-with-roles', async ctx => {
            await this.handleActionResult(ctx, () => this.createEmployeeWithRolesImpl(ctx.request.body));
        });
    }

    getEmployeesWithRoles(): any {
        return route.get(this.apiPrefix + 'employees-with-roles', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getEmployeesWithRoles());
        });
    }

    updateEmployeeWithRoles(): any {
        return route.post(this.apiPrefix + 'employees/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateEmployeeWithRolesImpl(ctx.request.body, this.getServerToken(ctx)));
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
        const createdEmployeeResult = await this.storageProvider.createEmployeeWithRoles(employeeWithRoles);
        return { value: createdEmployeeResult };
    }

    private async updateEmployeeWithRolesImpl(
        employeeWithRoles: IEmployeeWithRoles,
        serverToken: IServerToken
    ): Promise<IRouteActionResult<any> | void> {
        if (employeeWithRoles.employee.disabled && employeeWithRoles.employee.id.toUpperCase() === serverToken.accountId.toUpperCase()) {
            return { error: { message: `Can't disable own account`, number: 403 } };
        }
        if (employeeWithRoles.employee.id.toUpperCase() === PermissionsMapper.administratorEmployeeId.toUpperCase()) {
            // This is the administrator
            if (employeeWithRoles.employee.disabled) {
                return { error: { message: `Can't disable administrator account`, number: 403 } };
            }
            // Update only employee data but not the roles
            await this.storageProvider.updateEmployee(employeeWithRoles.employee);
        } else {
            await this.storageProvider.updateEmployeeWithRoles(employeeWithRoles);
        }
    }
}
