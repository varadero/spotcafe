import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { IEmployeeWithRoles } from '../../../../shared/interfaces/employee-with-roles';
import { IRole } from '../../../../shared/interfaces/role';

@Injectable()
export class DataService {
    private apiPrefix = '/api/';
    private useCache = true;

    constructor(
        private http: HttpClient,
        private authSvc: AuthService,
        private cacheSvc: CacheService
    ) { }

    getAllEmployeesWithRoles(): Promise<IEmployeeWithRoles[]> {
        return this.execGetWithCache('employees-with-roles');
    }

    logInEmployee(username: string, password: string): Promise<any> {
        return this.post('loginEmployee', { username: username, password: password });
    }

    getAllRoles(): Promise<IRole[]> {
        return this.execGetWithCache('roles');
    }

    updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void> {
        return this.post('employees/' + employeeWithRoles.employee.id, employeeWithRoles);
    }

    setUseCache(use: boolean) {
        this.useCache = use;
    }

    private execGetWithCache<T>(url: string): Promise<T> {
        return this.execWithCache(() => this.get(url), url);
    }

    private execWithCache<T>(fn: () => Promise<T>, cacheKey: string): Promise<T> {
        const existing = this.getFromCache<T>(cacheKey);
        if (existing) {
            return Promise.resolve(existing);
        }
        return fn().then(res => {
            this.setToCache(cacheKey, res);
            return res;
        });
    }

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

    private patch(url: string, body: any): Promise<any> {
        const headers = this.getHeaders();
        return this.http.patch(this.getApiUrl(url), body, { headers: headers }).toPromise().then(
            res => res,
            err => this.handleErr(err, url)
        );
    }

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

    private getFromCache<T>(key: string): T | undefined {
        if (!this.useCache) {
            return undefined;
        }
        return this.cacheSvc.getItem<T>(key);
    }

    private setToCache<T>(key: string, item: T): void {
        if (!this.useCache) {
            return;
        }
        this.cacheSvc.setItem(key, item);
    }
}
