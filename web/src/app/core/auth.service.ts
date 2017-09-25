import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

import { IToken } from '../../../../shared/interfaces/token';

@Injectable()
export class AuthService {
    loggedIn$ = new BehaviorSubject<IToken | null>(null);
    unauthorized$ = new Subject<string>();

    private tokenKey = 'spotcafe.token';
    private token: IToken | null;
    private isLoggedIn: boolean;
    private storage: Storage;

    constructor() {
        this.storage = this.getStorage();
        this.token = this.getTokenFromStorage();
        this.loggedIn$.next(this.token);
    }

    setLoggedIn(token: IToken) {
        this.isLoggedIn = true;
        this.token = token;
        this.setTokenToStorage(this.token);
        this.loggedIn$.next(token);
    }

    setLoggedOut(): void {
        this.isLoggedIn = false;
        this.token = null;
        this.remoteTokenFromStorage();
        this.loggedIn$.next(null);
    }

    setUnauthenticated(): void {
        this.isLoggedIn = false;
        this.token = null;
        this.setTokenToStorage(null);
        this.loggedIn$.next(null);
    }

    setUnauthorized(url: string): void {
        this.unauthorized$.next(url);
    }

    getToken(): IToken | null {
        return this.token;
    }

    private getStorage(): Storage {
        return sessionStorage;
    }

    private getTokenFromStorage(): IToken | null {
        const tokenValue = this.getFromStorage(this.tokenKey);
        if (!tokenValue) {
            return null;
        }
        try {
            const token = <IToken>JSON.parse(tokenValue);
            return token;
        } catch (err) {
            console.log(`Can't get token from storage`);
            return null;
        }
    }

    private setTokenToStorage(token: IToken | null): void {
        try {
            this.setToStorage(this.tokenKey, JSON.stringify(token));
        } catch (err) {
            console.log(`Can't set token to storage`);
        }
    }

    private remoteTokenFromStorage(): void {
        this.removeFromStorage(this.tokenKey);
    }

    private setToStorage(key: string, data: string): void {
        try {
            this.storage.setItem(key, data);
        } catch (err) {
            console.error(`Can't set storage item`, err);
        }
    }

    private getFromStorage(key: string): string | null {
        try {
            return this.storage.getItem(key);
        } catch (err) {
            console.error(`Can't get storage item`, err);
            return null;
        }
    }

    private removeFromStorage(key: string): void {
        try {
            this.storage.removeItem(key);
        } catch (err) {
            console.error(`Can't remove storage item`);
        }
    }
}

