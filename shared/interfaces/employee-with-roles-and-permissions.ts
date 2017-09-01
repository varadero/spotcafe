import { IEmployee } from './employee';
import { IRoleWithPermissions } from './role-with-permissions';

export interface IEmployeeWithRolesAndPermissions {
    employee: IEmployee;
    rolesWithPermissions: IRoleWithPermissions[];
}
