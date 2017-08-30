import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class AuthService {
    loggedIn$ = new BehaviorSubject<boolean>(false);

    private token: any;
    private isLoggedIn: boolean;

    constructor() {
        this.loggedIn$.next(false);
    }

    setLoggedIn(token: any) {
        this.isLoggedIn = true;
        this.loggedIn$.next(true);
    }

    setLoggedOut() {
        this.isLoggedIn = false;
        this.loggedIn$.next(false);
    }

    setUnauthorized() {
        this.isLoggedIn = false;
        this.token = null;
        this.loggedIn$.next(false);
    }

    getToken(): any {
        return this.token;
    }
}
