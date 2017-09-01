import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

import { IToken } from '../../../../shared/interfaces/token';

@Injectable()
export class AuthService {
    loggedIn$ = new BehaviorSubject<IToken>(null);
    unauthorized$ = new Subject<string>();

    private token: IToken;
    private isLoggedIn: boolean;

    constructor() {
        this.loggedIn$.next(null);
    }

    setLoggedIn(token: IToken) {
        this.isLoggedIn = true;
        this.token = token;
        this.loggedIn$.next(token);
    }

    setLoggedOut() {
        this.isLoggedIn = false;
        this.token = null;
        this.loggedIn$.next(null);
    }

    setUnauthenticated() {
        this.isLoggedIn = false;
        this.token = null;
        this.loggedIn$.next(null);
    }

    setUnauthorized(url: string) {
        this.unauthorized$.next(url);
    }

    getToken(): IToken {
        return this.token;
    }
}

