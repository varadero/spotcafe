import { IRoleWithPermissionsIds } from '../../../../../shared/interfaces/role-with-permissions-ids';
import { IRole } from '../../../../../shared/interfaces/role';
import { IPermission } from '../../../../../shared/interfaces/permission';

export class RolesService {
    clonePermissions(permissions: IPermission[]): ISelectablePermission[] {
        const selectablePermissions: ISelectablePermission[] = [];
        for (let i = 0; i < permissions.length; i++) {
            const permission = permissions[i];
            selectablePermissions.push({
                description: permission.description,
                id: permission.id,
                name: permission.name,
                selected: false
            });
        }
        return selectablePermissions;
    }

    createRolesWithPermissions(
        rolesWithPermissionsIds: IRoleWithPermissionsIds[],
        allPermissions: IPermission[]
    ): IRoleWithSelectablePermissions[] {
        const result: IRoleWithSelectablePermissions[] = [];
        for (let i = 0; i < rolesWithPermissionsIds.length; i++) {
            const roleWithPermissionsIds = rolesWithPermissionsIds[i];
            const role = <IRole>{
                description: roleWithPermissionsIds.role.description,
                id: roleWithPermissionsIds.role.id,
                name: roleWithPermissionsIds.role.name
            };
            const permissions: ISelectablePermission[] = [];
            for (let j = 0; j < allPermissions.length; j++) {
                const permission = allPermissions[j];
                const selectablePermission: ISelectablePermission = {
                    description: permission.description,
                    id: permission.id,
                    name: permission.name,
                    selected: roleWithPermissionsIds.permissionsIds.indexOf(permission.id) >= 0
                };
                permissions.push(selectablePermission);
            }
            result.push({ role: role, permissions: permissions });
        }
        return result;
    }

    getSanitizedRoleWithPermissions(roleWithSelectablePermissions: IRoleWithSelectablePermissions): IRoleWithPermissionsIds {
        const result: IRoleWithPermissionsIds = {
            permissionsIds: roleWithSelectablePermissions.permissions.filter(x => x.selected).map(x => x.id),
            role: Object.assign({}, roleWithSelectablePermissions.role)
        };
        return result;
    }

    getPermissionById(permissions: IPermission[], permissionId: string): IPermission | null {
        for (let i = 0; i < permissions.length; i++) {
            const permission = permissions[i];
            if (permission.id === permissionId) {
                return permission;
            }
        }
        return null;
    }

    getRoleErrors(role: IRole): IRoleErrors {
        const errors: IRoleErrors = <IRoleErrors>{};
        errors.nameIsEmpty = (!role.name || !role.name.trim());
        errors.hasErrors = (errors.nameIsEmpty);
        return errors;
    }
}

export interface ISelectablePermission extends IPermission {
    selected: boolean;
}

export interface IRoleWithSelectablePermissions {
    role: IRole;
    permissions: ISelectablePermission[];
}

export interface IRoleErrors {
    hasErrors: boolean;
    nameIsEmpty: boolean;
}
