import { ICreateDatabaseResult } from './create-database-result';
import { IPrepareDatabaseResult } from './prepare-database-result';
import { IPermission } from '../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';
import { IRole } from '../../shared/interfaces/role';
import { IRegisterClientDeviceResult } from './register-client-device-result';
import { IClientDevice } from '../../shared/interfaces/client-device';

export abstract class DatabaseProvider {
    abstract initialize(obj: any, ...args: any[]): void;
    abstract createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult>;
    abstract prepareDatabase(): Promise<IPrepareDatabaseResult>;
    abstract getTokenSecret(): Promise<string | null>;
    abstract getEmployeesWithRoles(): Promise<IEmployeeWithRoles[]>;
    abstract createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<string>;
    abstract updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void>;
    abstract getEmployeePermissionsIds(employeeId: string): Promise<string[]>;
    abstract getRoles(): Promise<IRole[]>;
    abstract getPermissions(): Promise<IPermission[]>;
    abstract getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions>;
    abstract registerClientDevice(id: string, name: string, address: string): Promise<IRegisterClientDeviceResult>;
    abstract getClientDevices(): Promise<IClientDevice[]>;
    abstract approveClientDevice(clientDevice: IClientDevice): Promise<void>;
    abstract updateClientDevice(clientDevice: IClientDevice): Promise<void>;
}
