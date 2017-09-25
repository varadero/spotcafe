import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './auth.service';
// import { CacheService } from './cache.service';
import { IEmployeeWithRoles } from '../../../../shared/interfaces/employee-with-roles';
import { IRole } from '../../../../shared/interfaces/role';
import { IClientDevice } from '../../../../shared/interfaces/client-device';
import { ICreateEmployeeResult } from '../../../../shared/interfaces/create-employee-result';
import { IRoleWithPermissionsIds } from '../../../../shared/interfaces/role-with-permissions-ids';
import { ICreateRoleWithPermissionsIdsResult } from '../../../../shared/interfaces/create-role-with-permissions-ids-result';
import { IPermission } from '../../../../shared/interfaces/permission';
import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';
import { IStartClientDeviceArgs } from '../../../../shared/interfaces/start-client-device-args';
import { IStartClientDeviceResult } from '../../../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceArgs } from '../../../../shared/interfaces/stop-client-device-args';
import { IStopClientDeviceResult } from '../../../../shared/interfaces/stop-client-device-result';

@Injectable()
export class DataService {
    private apiPrefix = '/api/';
    private useCache = true;

    constructor(
        private http: HttpClient,
        private authSvc: AuthService // ,
        // private cacheSvc: CacheService
    ) { }

    stopClientDevice(deviceId: string): Promise<IStopClientDeviceResult> {
        const args: IStopClientDeviceArgs = {
            deviceId: deviceId
        };
        return this.post('client-devices-status/' + encodeURIComponent(deviceId) + '/stop', args);
    }

    startClientDevice(deviceId: string): Promise<IStartClientDeviceResult> {
        const args: IStartClientDeviceArgs = {
            deviceId: deviceId
        };
        return this.post('client-devices-status/' + encodeURIComponent(deviceId) + '/start', args);
    }

    getClientDevicesStatus(): Promise<IClientDeviceStatus[]> {
        return this.get('client-devices-status');
    }

    createRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<ICreateRoleWithPermissionsIdsResult> {
        return this.post('roles-with-permissions-ids', roleWithPermissionsIds);
    }

    updateRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<void> {
        return this.post('roles-with-permissions-ids/' + encodeURIComponent(roleWithPermissionsIds.role.id), roleWithPermissionsIds);
    }

    getPermissions(): Promise<IPermission[]> {
        return this.get('permissions');
    }

    getRolesWithPermissionsIds(): Promise<IRoleWithPermissionsIds[]> {
        return this.get('roles-with-permissions-ids');
    }

    updateClientDevice(clientDevice: IClientDevice): Promise<void> {
        return this.post('client-devices/' + encodeURIComponent(clientDevice.id), clientDevice);
    }

    approveClientDevice(clientDevice: IClientDevice): Promise<void> {
        return this.post('client-devices/' + encodeURIComponent(clientDevice.id) + '/approve', clientDevice);
    }

    getClientDevices(): Promise<IClientDevice[]> {
        return this.get('client-devices');
    }

    createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<ICreateEmployeeResult> {
        return this.post('employees-with-roles', employeeWithRoles);
    }

    getEmployeesWithRoles(): Promise<IEmployeeWithRoles[]> {
        return this.get('employees-with-roles');
    }

    logInEmployee(username: string, password: string): Promise<any> {
        return this.post('login-employee', { username: username, password: password });
    }

    getRoles(): Promise<IRole[]> {
        return this.get('roles');
    }

    updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void> {
        return this.post('employees/' + encodeURIComponent(employeeWithRoles.employee.id), employeeWithRoles);
    }

    setUseCache(use: boolean) {
        this.useCache = use;
    }

    // private execGetWithCache<T>(url: string): Promise<T> {
    //     return this.execWithCache(() => this.get(url), url);
    // }

    // private execWithCache<T>(fn: () => Promise<T>, cacheKey: string): Promise<T> {
    //     const existing = this.getFromCache<T>(cacheKey);
    //     if (existing) {
    //         return Promise.resolve(existing);
    //     }
    //     return fn().then(res => {
    //         this.setToCache(cacheKey, res);
    //         return res;
    //     });
    // }

    private get(url: string): Promise<any> {
        const headers = this.getHeaders();
        return this.http.get(this.getApiUrl(url), { headers: headers }).toPromise().then(
            res => res,
            err => this.handleErr(err, url)
        );
    }

    private post(url: string, body: any): Promise<any> {
        const headers = this.getHeaders();
        return this.http.post(this.getApiUrl(url), body, { headers: headers }).toPromise().then(
            res => res,
            err => this.handleErr(err, url)
        );
    }

    // private patch(url: string, body: any): Promise<any> {
    //     const headers = this.getHeaders();
    //     return this.http.patch(this.getApiUrl(url), body, { headers: headers }).toPromise().then(
    //         res => res,
    //         err => this.handleErr(err, url)
    //     );
    // }

    private handleErr(err: any, url: string): never {
        if (err.error && err.error.message) {
            // this.notificationsSvc.showNotification(err.error.message);
        }
        if (err.status === 401) {
            this.authSvc.setUnauthenticated();
        } else if (err.status === 403) {
            this.authSvc.setUnauthorized(url);
        }
        throw err;
    }

    private getApiUrl(path: string): string {
        return this.apiPrefix + path;
    }

    private getHeaders(): HttpHeaders | undefined {
        const token = this.authSvc.getToken();
        if (token) {
            return new HttpHeaders().set('Authorization', 'Bearer ' + token.token);
        }
        return undefined;
    }

    // private getFromCache<T>(key: string): T | undefined {
    //     if (!this.useCache) {
    //         return undefined;
    //     }
    //     return this.cacheSvc.getItem<T>(key);
    // }

    // private setToCache<T>(key: string, item: T): void {
    //     if (!this.useCache) {
    //         return;
    //     }
    //     this.cacheSvc.setItem(key, item);
    // }
}
