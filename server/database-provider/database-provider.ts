import { ICreateDatabaseResult } from './create-database-result';
import { IPrepareDatabaseResult } from './prepare-database-result';
import { IPermission } from '../shared/interfaces/permission';
import { IEmployeeWithPermissions } from '../shared/interfaces/employee-with-permissions';

export abstract class DatabaseProvider {
    abstract initialize(obj: any): void;
    abstract createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult>;
    abstract prepareDatabase(): Promise<IPrepareDatabaseResult>;
    abstract getTokenSecret(): Promise<string | null>;
    abstract getAllPermissions(): Promise<IPermission[]>;
    abstract getEmployeeWithPermissions(username: string, password: string): Promise<IEmployeeWithPermissions>;
}
