import { IPermission } from './permission';
import { IEmployee } from './employee';

export interface IEmployeeWithPermissions {
    employee: IEmployee;
    permissions: IPermission[];
}
