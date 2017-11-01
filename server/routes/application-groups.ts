import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IBaseEntity } from '../../shared/interfaces/base-entity';
import { ICreateEntityResult } from '../../shared/interfaces/create-entity-result';
import { IUpdateEntityResult } from '../../shared/interfaces/update-entity-result';

export class ApplicationGroupsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getApplicationGroups(): any {
        return route.get(this.apiPrefix + 'application-groups', async ctx => {
            await this.handleActionResult(ctx, () => this.getApplicationGroupsImpl());
        });
    }

    createApplicationGroup(): any {
        return route.post(this.apiPrefix + 'application-groups', async ctx => {
            await this.handleActionResult(ctx, () => this.createApplicationGroupImpl(ctx.request.body));
        });
    }

    updateApplicationGroup(): any {
        return route.post(this.apiPrefix + 'application-groups/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateApplicationGroupImpl(ctx.request.body));
        });
    }

    private async getApplicationGroupsImpl(): Promise<IRouteActionResult<IBaseEntity[]> | void> {
        const result = await this.storageProvider.getApplicationGroups();
        return { value: result };
    }

    private async createApplicationGroupImpl(applicationGroup: IBaseEntity): Promise<IRouteActionResult<ICreateEntityResult> | void> {
        applicationGroup.name = applicationGroup.name.trim();
        if (!applicationGroup.name) {
            return { error: { message: 'Name is required', number: 422 } };
        }
        const result = await this.storageProvider.createApplicationGroup(applicationGroup);
        return { value: result };
    }

    private async updateApplicationGroupImpl(applicationGroup: IBaseEntity): Promise<IRouteActionResult<IUpdateEntityResult> | void> {
        const result = await this.storageProvider.updateApplicationGroup(applicationGroup);
        return { value: result };
    }

    // client.username = client.username.trim();
    // if (!client.username) {
    //     return { error: { message: 'User name is required', number: 422 } };
    // }

    // createEmployeeWithRoles(): any {
    //     return route.post(this.apiPrefix + 'employees-with-roles', async ctx => {
    //         await this.handleActionResult(ctx, () => this.createEmployeeWithRolesImpl(ctx.request.body));
    //     });
    // }

    // getEmployeesWithRoles(): any {
    //     return route.get(this.apiPrefix + 'employees-with-roles', async ctx => {
    //         await this.handleResult(ctx, () => this.storageProvider.getEmployeesWithRoles());
    //     });
    // }

    // updateEmployeeWithRoles(): any {
    //     return route.post(this.apiPrefix + 'employees/:id', async ctx => {
    //         await this.handleActionResult(ctx, () => this.updateEmployeeWithRolesImpl(ctx.request.body, this.getServerToken(ctx)));
    //     });
    // }

    // private async createEmployeeWithRolesImpl(
    //     employeeWithRoles: IEmployeeWithRoles
    // ): Promise<IRouteActionResult<ICreateEmployeeResult> | void> {
    //     if (employeeWithRoles.employee.password.length < 6) {
    //         return { error: { message: 'Password length must be at least 6 characters', number: 422 } };
    //     }
    //     employeeWithRoles.employee.username = employeeWithRoles.employee.username.trim();
    //     if (!employeeWithRoles.employee.username) {
    //         return { error: { message: 'User name is required', number: 422 } };
    //     }
    //     const createdEmployeeResult = await this.storageProvider.createEmployeeWithRoles(employeeWithRoles);
    //     return { value: createdEmployeeResult };
    // }

    // private async updateEmployeeWithRolesImpl(
    //     employeeWithRoles: IEmployeeWithRoles,
    //     serverToken: IServerToken
    // ): Promise<IRouteActionResult<any> | void> {
    //     if (employeeWithRoles.employee.disabled && employeeWithRoles.employee.id.toUpperCase() === serverToken.accountId.toUpperCase()) {
    //         return { error: { message: `Can't disable own account`, number: 403 } };
    //     }
    //     if (employeeWithRoles.employee.id.toUpperCase() === PermissionsMapper.administratorEmployeeId.toUpperCase()) {
    //         // This is the administrator
    //         if (employeeWithRoles.employee.disabled) {
    //             return { error: { message: `Can't disable administrator account`, number: 403 } };
    //         }
    //         // Update only employee data but not the roles
    //         await this.storageProvider.updateEmployee(employeeWithRoles.employee);
    //     } else {
    //         await this.storageProvider.updateEmployeeWithRoles(employeeWithRoles);
    //     }
    // }
}
