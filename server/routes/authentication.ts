import * as Koa from 'koa';
import * as route from 'koa-route';
import * as jwt from 'jsonwebtoken';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IToken } from '../../shared/interfaces/token';
import { PermissionsMapper } from '../utils/permissions-mapper';

export class AuthenticationRoutes {
    private tokenSecret: string | null;
    private permissionsMapper = new PermissionsMapper();

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    logInEmployee(): any {
        return route.post(this.apiPrefix + 'loginEmployee', this.logIn.bind(this));
    }

    checkAuthorization() {
        return this.checkAuthorizationImpl.bind(this);
    }

    private async checkAuthorizationImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const authHeaderValue = <string>ctx.headers.authorization;
        const tokenString = authHeaderValue.split(' ')[1];
        const tokenObj = await this.verifyToken(tokenString);
        if (!tokenObj) {
            return ctx.throw(401);
        }
        const requiredPermission = this.getRequiredPermission(ctx.method, ctx.path);
        if (!requiredPermission) {
            // Can't find permission for that method and url path - don't allow execution
            return ctx.throw(403);
        }
        const hasPermission = this.permissionsMapper.hasPermission(requiredPermission, tokenObj.permissions);
        if (!hasPermission) {
            return ctx.throw(403);
        }
        return next();
    }

    private getRequiredPermission(method: string, urlPath: string): string | null {
        const pids = this.permissionsMapper.permissionIds;
        if (method === 'GET' && urlPath === this.apiPrefix + 'employees') {
            return pids.employeesView;
        }
        if (method === 'POST' && urlPath === this.apiPrefix + 'employees') {
            return pids.employeesModify;
        }

        return null;
    }

    private async verifyToken(token: string): Promise<IServerToken> {
        const tokenSecret = await this.getTokenSecret();
        const promise = new Promise<IServerToken>((resolve, reject) => {
            jwt.verify(token, tokenSecret || '', (err: any, decoded: object | string) => {
                if (err) {
                    return reject(err);
                }
                return resolve(<IServerToken>decoded);
            });
        });
        return promise;
    }

    private async logIn(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const credentials = <{ username: string, password: string }>ctx.request.body;
        const userWithPermissions = await this.dataProvider.getEmployeeWithRolesAndPermissions(credentials.username, credentials.password);
        if (!userWithPermissions.employee) {
            // This employee was not found
            return ctx.throw(401);
        }
        if (userWithPermissions.employee.disabled) {
            // This employee is disabled
            return ctx.throw(401);
        }

        // Get all permissions from all employee roles
        const allPermissionIds: string[] = [];
        for (let i = 0; i < userWithPermissions.rolesWithPermissions.length; i++) {
            const permissions = userWithPermissions.rolesWithPermissions[i].permissions;
            allPermissionIds.push(...permissions.map(x => x.id));
        }
        // Create token object for crypting including mapped permissions
        const tokenObj = {
            employeeId: userWithPermissions.employee.id,
            permissions: this.permissionsMapper.mapToBinaryString(allPermissionIds)
        };
        const tokenSecret = await this.getTokenSecret();
        // Use UTC time
        const expiresIn = new Date().getTime();
        const tokenString = jwt.sign(tokenObj, tokenSecret || '', { expiresIn: expiresIn });

        // Create token for the client application
        const body: IToken = {
            token: tokenString,
            expiresIn: expiresIn,
            permissions: tokenObj.permissions
        };
        ctx.body = body;
        return body;
    }

    private async getTokenSecret(): Promise<string | null> {
        if (this.tokenSecret) {
            return Promise.resolve(this.tokenSecret);
        }
        this.tokenSecret = await this.dataProvider.getTokenSecret();
        return this.tokenSecret;
    }
}

interface IServerToken {
    employeeId: string;
    exp: number;
    iat: number;
    permissions: string;
}
