import { IEmployee } from './employee';
import { IRoleWithPermisions } from './role-with-permissions';

export interface IEmployeeWithRolesAndPermissions {
    employee: IEmployee;
    rolesWithPermissions: IRoleWithPermisions[];
}
