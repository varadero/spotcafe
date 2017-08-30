import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './auth.service';

@Injectable()
export class DataService {
    private apiPrefix = '/api/';

    constructor(private http: Http, private authSvc: AuthService) { }

    logInEmployee(username: string, password: string): Promise<any> {
        return this.post('loginEmployee', { username: username, password: password });
    }

    getAllUsers(): Promise<any> {
        return this.get('users');
    }

    private get(url: string): Promise<any> {
        return this.http.get(this.getApiUrl(url)).toPromise().then(
            res => res.json(),
            err => this.handleErr(err)
        );
    }

    private post(url: string, body: any, options?: RequestOptionsArgs): Promise<any> {
        return this.http.post(this.getApiUrl(url), body, options).toPromise().then(
            res => res.json(),
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
}
