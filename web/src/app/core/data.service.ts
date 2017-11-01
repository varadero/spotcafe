import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
import { IDeviceGroup } from '../../../../shared/interfaces/device-group';
import { IUpdateDeviceGroupResult } from '../../../../shared/interfaces/update-device-group-result';
import { ICreateDeviceGroupResult } from '../../../../shared/interfaces/create-device-group-result';
import { IClientGroupWithDevicesGroupsIds } from '../../../../shared/interfaces/client-group-with-devices-groups-ids';
import { IUpdateClientGroupResult } from '../../../../shared/interfaces/update-client-group-result';
import { ICreateClientGroupResult } from '../../../../shared/interfaces/create-client-group-result';
import { IClient } from '../../../../shared/interfaces/client';
import { ICreateEntityResult } from '../../../../shared/interfaces/create-entity-result';
import { IUpdateEntityResult } from '../../../../shared/interfaces/update-entity-result';
import { IDateAndTime } from '../../../../shared/interfaces/date-and-time';
import { IFromToDateAndTime } from '../../../../shared/interfaces/from-to-date-and-time';
import { ITotalsByClientDeviceAndEmployee } from '../../../../shared/interfaces/totals-by-client-device-and-employee';
import { IAddClientCreditArgs } from '../../../../shared/interfaces/add-client-credit-args';
import { IBaseEntity } from '../../../../shared/interfaces/base-entity';

@Injectable()
export class DataService {
    private apiPrefix = '/api/';
    private useCache = true;

    constructor(
        private http: HttpClient,
        private authSvc: AuthService // ,
        // private cacheSvc: CacheService
    ) { }

    updateApplicationGroup(applicationGroup: IBaseEntity): Promise<IUpdateEntityResult> {
        return this.post('application-groups/' + encodeURI(applicationGroup.id), applicationGroup);
    }

    createApplicationGroup(applicationGroup: IBaseEntity): Promise<ICreateEntityResult> {
        return this.post('application-groups', applicationGroup);
    }

    getApplicationGroups(): Promise<IBaseEntity[]> {
        return this.get('application-groups');
    }

    addClientCredit(clientId: string, credit: number): Promise<number> {
        const args: IAddClientCreditArgs = {
            clientId: clientId,
            credit: credit
        };
        return this.post('client-credit/' + encodeURIComponent(clientId), args);
    }

    getTotalsByClientDeviceAndEmployee(from: IDateAndTime, to: IDateAndTime): Promise<ITotalsByClientDeviceAndEmployee> {
        return this.getWithParams('reports/totals-by-client-device-and-employee', this.periodToParams(from, to));
    }

    getClients(): Promise<IClient[]> {
        return this.get('clients');
    }

    createClient(client: IClient): Promise<ICreateEntityResult> {
        return this.post('clients', client);
    }

    updateClient(client: IClient): Promise<IUpdateEntityResult> {
        return this.post('clients/' + encodeURI(client.id), client);
    }

    createClientGroup(clientGroupWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds): Promise<ICreateClientGroupResult> {
        return this.post('clients-groups-with-devices-groups', clientGroupWithDevicesGroupsIds);
    }

    updateClientGroup(clientGroupWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds): Promise<IUpdateClientGroupResult> {
        return this.post('clients-groups-with-devices-groups/'
            + encodeURI(clientGroupWithDevicesGroupsIds.clientGroup.id), clientGroupWithDevicesGroupsIds);
    }

    getClientsGroups(): Promise<IClientGroupWithDevicesGroupsIds[]> {
        return this.get('clients-groups-with-devices-groups');
    }

    createDeviceGroup(deviceGroup: IDeviceGroup): Promise<ICreateDeviceGroupResult> {
        return this.post('devices-groups', deviceGroup);
    }

    updateDeviceGroup(deviceGroup: IDeviceGroup): Promise<IUpdateDeviceGroupResult> {
        return this.post('devices-groups/' + encodeURI(deviceGroup.id), deviceGroup);
    }

    getDevicesGroups(): Promise<IDeviceGroup[]> {
        return this.get('devices-groups');
    }

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

    private getWithParams(url: string, params: any): Promise<any> {
        const headers = this.getHeaders();
        let httpParams = new HttpParams();
        const paramsKeys = Object.getOwnPropertyNames(params);
        for (const key of paramsKeys) {
            httpParams = httpParams.append(key, params[key]);
        }
        return this.http.get(this.getApiUrl(url), { headers: headers, params: httpParams }).toPromise().then(
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

    private periodToParams(from: IDateAndTime, to: IDateAndTime): IFromToDateAndTime {
        return {
            fromYear: from.year, fromMonth: from.month, fromDay: from.day, fromMinute: from.minute,
            toYear: to.year, toMonth: to.month, toDay: to.day, toMinute: to.minute,
        };
    }
}
