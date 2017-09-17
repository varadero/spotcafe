import { ICreateStorageResult } from './create-storage-result';
import { IPrepareStorageResult } from './prepare-storage-result';
import { IPermission } from '../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../shared/interfaces/employee-with-roles-and-permissions';
import { IEmployeeWithRoles } from '../../shared/interfaces/employee-with-roles';
import { IRole } from '../../shared/interfaces/role';
import { IRegisterClientDeviceResult } from './register-client-device-result';
import { IClientDevice } from '../../shared/interfaces/client-device';
import { ICreateEmployeeResult } from '../../shared/interfaces/create-employee-result';
import { IClientFilesData } from './client-files-data';

export abstract class StorageProvider {
    abstract initialize(config: any, ...args: any[]): void;
    abstract createStorage(administratorPassword: string): Promise<ICreateStorageResult>;
    abstract prepareStorage(): Promise<IPrepareStorageResult>;
    abstract getTokenSecret(): Promise<string | null>;
    abstract getEmployeesWithRoles(): Promise<IEmployeeWithRoles[]>;
    abstract createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<ICreateEmployeeResult>;
    abstract updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void>;
    abstract getEmployeePermissionsIds(employeeId: string): Promise<string[]>;
    abstract getRoles(): Promise<IRole[]>;
    abstract getPermissions(): Promise<IPermission[]>;
    abstract getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions>;
    abstract registerClientDevice(id: string, name: string, address: string): Promise<IRegisterClientDeviceResult>;
    abstract getClientDevices(): Promise<IClientDevice[]>;
    abstract approveClientDevice(clientDevice: IClientDevice): Promise<void>;
    abstract updateClientDevice(clientDevice: IClientDevice): Promise<void>;
    abstract getClientFiles(): Promise<IClientFilesData | null>;
    abstract setClientFiles(clientFiles: IClientFilesData): Promise<void>;
}
