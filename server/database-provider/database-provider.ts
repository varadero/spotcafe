import { ICreateDatabaseResult } from './create-database-result';
import { IPrepareDatabaseResult } from './prepare-database-result';
import { IPermission } from '../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IEmployee } from '../../shared/interfaces/employee';

export abstract class DatabaseProvider {
    abstract initialize(obj: any, ...args: any[]): void;
    abstract createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult>;
    abstract prepareDatabase(): Promise<IPrepareDatabaseResult>;
    abstract getTokenSecret(): Promise<string | null>;
    abstract getEmployees(): Promise<IEmployee[]>;
    abstract getEmployeePermissionsIds(employeeId: string): Promise<string[]>;
    abstract getAllPermissions(): Promise<IPermission[]>;
    abstract getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions>;
}
