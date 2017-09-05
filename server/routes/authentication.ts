import * as Koa from 'koa';
import * as route from 'koa-route';
import * as jwt from 'jsonwebtoken';

import { DatabaseProvider } from '../database-provider/database-provider';
import { IToken } from '../../shared/interfaces/token';
import { PermissionsMapper } from '../utils/permissions-mapper';
import { IServerToken } from './interfaces/server-token';
import { ErrorMessage } from '../utils/error-message';

export class AuthenticationRoutes {
    private tokenSecret: string | null;
    private permissionsMapper = new PermissionsMapper();
    private errorMessage = new ErrorMessage();

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
    }

    logInEmployee(): any {
        return route.post(this.apiPrefix + 'loginEmployee', this.logInEmployeeImpl.bind(this));
    }

    checkAuthorization() {
        return this.checkAuthorizationImpl.bind(this);
    }

    private async checkAuthorizationImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const authHeaderValue = <string>ctx.headers.authorization;
        const tokenString = authHeaderValue.split(' ')[1];
        const tokenObj = await this.verifyToken(tokenString);
        // Set token into request context in order to be available for all other middlewares
        ctx.state.token = tokenObj;
        if (!tokenObj) {
            return ctx.throw(401);
        }
        const requiredPermission = this.getRequiredPermission(ctx.method, ctx.path, ctx.state.token);
        if (!requiredPermission) {
            // Can't find permission for that method and url path - don't allow execution
            return ctx.throw(this.errorMessage.create('URL forbidden'), 403);
        }
        const hasPermission = this.permissionsMapper.hasPermission(requiredPermission, tokenObj.permissions);
        if (!hasPermission) {
            return ctx.throw(this.errorMessage.create('No permission'), 403);
        }
        return next();
    }

    private getRequiredPermission(method: string, urlPath: string, token: IServerToken): string | null {
        const pids = this.permissionsMapper.permissionIds;
        // if (method === 'GET' && urlPath === this.apiPrefix + 'employees') {
        //     return pids.employeesView;
        // }
        if (method === 'GET' && urlPath === this.apiPrefix + 'employees-with-roles') {
            return pids.employeesView;
        }
        if (method === 'POST' && urlPath === this.apiPrefix + 'employees-with-roles') {
            return pids.employeesModify;
        }
        if (method === 'POST' && urlPath.startsWith(this.apiPrefix + 'employees')) {
            return pids.employeesModify;
        }
        if (method === 'GET' && urlPath === this.apiPrefix + 'roles') {
            return pids.employeesView;
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

    private async logInEmployeeImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
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
        const serverToken: IServerToken = <IServerToken>{};
        serverToken.accountId = userWithPermissions.employee.id;
        serverToken.type = 'employee';
        serverToken.permissions = this.permissionsMapper.mapToBinaryString(allPermissionIds);
        const tokenSecret = await this.getTokenSecret();
        // Use UTC time
        const expiresIn = await this.getTokenDuration();
        const tokenString = jwt.sign(serverToken, tokenSecret || '', { expiresIn: expiresIn });

        // Create token for the client application
        const body: IToken = {
            token: tokenString,
            expiresIn: expiresIn,
            permissions: serverToken.permissions
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

    private getTokenDuration(): Promise<number> {
        // Token expires in 24 hours
        return Promise.resolve(24 * 60 * 60);
    }
}
