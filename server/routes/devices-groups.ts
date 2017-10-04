import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class DevicesGroupsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getAllDevicesGroups(): any {
        return route.get(this.apiPrefix + 'devices-groups', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getDevicesGroups());
        });
    }

    // getAllRolesWithPermissionIds(): any {
    //     return route.get(this.apiPrefix + 'roles-with-permissions-ids', async ctx => {
    //         await this.handleResult(ctx, () => this.storageProvider.getRolesWithPermissionsIds());
    //     });
    // }

    // updateRoleWithPermissionsIds(): any {
    //     return route.post(this.apiPrefix + 'roles-with-permissions-ids/:id', async ctx => {
    //         await this.handleActionResult(ctx, () => this.updateRoleWithPermissionsIdsImp(ctx.request.body));
    //     });
    // }

    // createRoleWithPermissionsIds(): any {
    //     return route.post(this.apiPrefix + 'roles-with-permissions-ids', async ctx => {
    //         await this.handleActionResult(ctx, () => this.createRoleWithPermissionsIdsImp(ctx.request.body));
    //     });
    // }

    // private async updateRoleWithPermissionsIdsImp(
    //     roleWithPermissionsIds: IRoleWithPermissionsIds
    // ): Promise<IRouteActionResult<void> | void> {
    //     if (roleWithPermissionsIds.role.id.toUpperCase() === PermissionsMapper.administratorRoleId.toUpperCase()) {
    //         return { error: { message: `Modifying Administrator role is forbidden`, number: 403 } };
    //     }
    //     roleWithPermissionsIds.role.name = roleWithPermissionsIds.role.name.trim();
    //     if (!roleWithPermissionsIds.role.name) {
    //         return { error: { message: 'Name is required', number: 400 } };
    //     }
    //     await this.storageProvider.updateRoleWithPermissionsIds(roleWithPermissionsIds);
    // }

    // private async createRoleWithPermissionsIdsImp(
    //     roleWithPermissionsIds: IRoleWithPermissionsIds
    // ): Promise<IRouteActionResult<ICreateRoleWithPermissionsIdsResult> | void> {
    //     roleWithPermissionsIds.role.name = roleWithPermissionsIds.role.name.trim();
    //     if (!roleWithPermissionsIds.role.name) {
    //         return { error: { message: 'Name is required', number: 400 } };
    //     }
    //     const createRoleReslt = await this.storageProvider.createRoleWithPermissionsIds(roleWithPermissionsIds);
    //     return { value: createRoleReslt };
    // }
}
