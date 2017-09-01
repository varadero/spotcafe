import { Injectable } from '@angular/core';
// import { Http, RequestOptionsArgs, Response } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './auth.service';

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

    private get(url: string): Promise<any> {
        const headers = this.getHeaders();
        return this.http.get(this.getApiUrl(url), { headers: headers }).toPromise().then(
            res => res,
            err => this.handleErr(err)
        );
    }

    private post(url: string, body: any): Promise<any> {
        const headers = this.getHeaders();
        return this.http.post(this.getApiUrl(url), body, { headers: headers }).toPromise().then(
            res => res,
            err => this.handleErr(err)
        );
    }

    private handleErr(err: any): never {
        if (err.status === 401) {
            this.authSvc.setUnauthorized();
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
