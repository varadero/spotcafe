import { IRole } from './role';
import { IEmployee } from './employee';

export interface IEmployeeWithRoles {
    employee: IEmployee;
    roles: IRole[];
}
