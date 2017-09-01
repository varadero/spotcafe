import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { IToken } from '../../../../shared/interfaces/token';

@Injectable()
export class AuthService {
    loggedIn$ = new BehaviorSubject<IToken>(null);

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

    setUnauthorized() {
        this.isLoggedIn = false;
        this.token = null;
        this.loggedIn$.next(null);
    }

    getToken(): IToken {
        return this.token;
    }
}

