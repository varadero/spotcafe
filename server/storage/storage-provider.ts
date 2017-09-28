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
import { IRoleWithPermissionsIds } from '../../shared/interfaces/role-with-permissions-ids';
import { IEmployee } from '../../shared/interfaces/employee';
import { ICreateRoleWithPermissionsIdsResult } from '../../shared/interfaces/create-role-with-permissions-ids-result';
import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';
import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';
import { IStartClientDeviceResult } from '../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceArgs } from '../../shared/interfaces/stop-client-device-args';
import { IStopClientDeviceResult } from '../../shared/interfaces/stop-client-device-result';

export abstract class StorageProvider {
    abstract initialize(config: any, ...args: any[]): void;

    abstract createStorage(administratorPassword: string): Promise<ICreateStorageResult>;

    abstract prepareStorage(): Promise<IPrepareStorageResult>;

    abstract getTokenSecret(): Promise<string | null>;

    abstract getClientDevicesStatus(): Promise<IClientDeviceStatus[]>;
    abstract getClientDeviceStatus(deviceId: string): Promise<IClientDeviceStatus>;

    abstract getEmployeesWithRoles(): Promise<IEmployeeWithRoles[]>;
    abstract createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<ICreateEmployeeResult>;
    abstract updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void>;

    abstract updateEmployee(employee: IEmployee): Promise<void>;
    abstract getEmployeePermissionsIds(employeeId: string): Promise<string[]>;
    abstract getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions>;

    abstract getRoles(): Promise<IRole[]>;

    abstract getPermissions(): Promise<IPermission[]>;

    abstract getRolesWithPermissionsIds(): Promise<IRoleWithPermissionsIds[]>;
    abstract updateRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<void>;
    abstract createRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<ICreateRoleWithPermissionsIdsResult>;

    abstract registerClientDevice(id: string, name: string, address: string): Promise<IRegisterClientDeviceResult>;
    abstract getClientDevices(): Promise<IClientDevice[]>;
    abstract getClientDevice(deviceId: string): Promise<IClientDevice>;
    abstract approveClientDevice(clientDevice: IClientDevice): Promise<void>;
    abstract updateClientDevice(clientDevice: IClientDevice): Promise<void>;
    abstract startClientDevice(args: IStartClientDeviceArgs, startedAt: number): Promise<IStartClientDeviceResult>;
    abstract stopClientDevice(args: IStopClientDeviceArgs, stoppedAt: number): Promise<IStopClientDeviceResult>;

    abstract getClientFiles(): Promise<IClientFilesData | null>;
    abstract setClientFiles(clientFiles: IClientFilesData): Promise<void>;
}
