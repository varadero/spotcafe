import { ICreateDatabaseResult } from './create-database-result';
import { IPrepareDatabaseResult } from './prepare-database-result';
import { IPermission } from '../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';

export abstract class DatabaseProvider {
    abstract initialize(obj: any): void;
    abstract createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult>;
    abstract prepareDatabase(): Promise<IPrepareDatabaseResult>;
    abstract getTokenSecret(): Promise<string | null>;
    abstract getAllPermissions(): Promise<IPermission[]>;
    abstract getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions>;
}
