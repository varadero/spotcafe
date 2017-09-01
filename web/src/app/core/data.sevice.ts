import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './auth.service';
import { IEmployee } from '../../../../shared/interfaces/employee';

@Injectable()
export class DataService {
    private apiPrefix = '/api/';

    constructor(private http: HttpClient, private authSvc: AuthService) { }

    logInEmployee(username: string, password: string): Promise<any> {
        return this.post('loginEmployee', { username: username, password: password });
    }

    getAllEmployees(): Promise<any> {
        return this.get('employees');
    }

    updateEmployee(employee: IEmployee): Promise<void> {
        // TODO Here we could remove some properties like id, because this is set in the url
        // But this needs to use a clone of the employee in order to not change its properties in the caller
        return this.post('employees/' + employee.id, employee);
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
}
