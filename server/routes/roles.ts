import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRoleWithPermissionsIds } from '../../shared/interfaces/role-with-permissions-ids';
import { PermissionsMapper } from '../utils/permissions-mapper';
import { IRouteActionResult } from './interfaces/route-action-result';

export class RolesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getAllRoles(): any {
        return route.get(this.apiPrefix + 'roles', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getRoles());
        });
    }

    getAllRolesWithPermissionIds(): any {
        return route.get(this.apiPrefix + 'roles-with-permissions-ids', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getRolesWithPermissionsIds());
        });
    }

    updateRoleWithPermissionsIds(): any {
        return route.post(this.apiPrefix + 'roles-with-permissions-ids/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateRoleWithPermissionsIdsImp(ctx.request.body));
        });
    }

    private async updateRoleWithPermissionsIdsImp(
        roleWithPermissionsIds: IRoleWithPermissionsIds
    ): Promise<IRouteActionResult<void> | void> {
        if (roleWithPermissionsIds.role.id.toUpperCase() === PermissionsMapper.administratorRoleId.toUpperCase()) {
            return { error: { message: `Modifying Administrator role is forbidden`, number: 403 } };
        }
        await this.storageProvider.updateRoleWithPermissionsIds(roleWithPermissionsIds);
    }
}
