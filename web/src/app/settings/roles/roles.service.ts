import { Injectable } from '@angular/core';
import { IRoleWithPermissionsIds } from '../../../../../shared/interfaces/role-with-permissions-ids';
import { IRoleWithPermissions } from '../../../../../shared/interfaces/role-with-permissions';
import { IRole } from '../../../../../shared/interfaces/role';
import { IPermission } from '../../../../../shared/interfaces/permission';

@Injectable()
export class RolesService {
    createRolesWithPermissions(
        rolesWithPermissionsIds: IRoleWithPermissionsIds[],
        allPermissions: IPermission[]
    ): IRoleWithPermissions[] {
        const result: IRoleWithPermissions[] = [];
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
                    selected: roleWithPermissionsIds.permissionsIds.includes(permission.id)
                };
                permissions.push(selectablePermission);
            }
            result.push({ role: role, permissions: permissions });
        }
        return result;
    }

    getPermissionById(permissions: IPermission[], permissionId: string): IPermission {
        for (let i = 0; i < permissions.length; i++) {
            const permission = permissions[i];
            if (permission.id === permissionId) {
                return permission;
            }
        }
        return null;
    }
    // addAllPermissionsToAllRoles(employeesWithRoles: IEmployeeWithRoles[], allRoles: IRole[]): void {
    //     for (let i = 0; i < employeesWithRoles.length; i++) {
    //         const employeeWithRole = employeesWithRoles[i];
    //         const employeeRoles = <ISelectableRole[]>employeeWithRole.roles;
    //         employeeRoles.forEach(x => x.selected = true);
    //         this.addMissingRoles(employeeWithRole.roles, allRoles);
    //     }
    // }

    // addMissingRoles(roles: IRole[], allRoles: IRole[]): void {
    //     for (let i = 0; i < allRoles.length; i++) {
    //         const role = allRoles[i];
    //         const existingRole = this.getRoleById(roles, role.id);
    //         if (!existingRole) {
    //             const selectableRole = <ISelectableRole>role;
    //             selectableRole.selected = false;
    //             roles.push(selectableRole);
    //         }
    //     }
    // }

    // private getRoleById(roles: IRole[], roleId: string): IRole {
    //     for (let i = 0; i < roles.length; i++) {
    //         const role = roles[i];
    //         if (role.id === roleId) {
    //             return role;
    //         }
    //     }
    //     return null;
    // }
}

export interface ISelectablePermission extends IPermission {
    selected: boolean;
}
