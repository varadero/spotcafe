import * as Koa from 'koa';
import * as route from 'koa-route';
import * as jwt from 'jsonwebtoken';

import { StorageProvider } from '../storage/storage-provider';
import { IToken } from '../../shared/interfaces/token';
import { PermissionsMapper } from '../utils/permissions-mapper';
import { IServerToken } from './interfaces/server-token';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';

export class AuthenticationRoutes extends RoutesBase {
    private tokenSecret: string | null;
    private permissionsMapper = new PermissionsMapper();

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    logInEmployee(): any {
        return route.post(this.apiPrefix + 'login-employee', async ctx => {
            await this.handleActionResult(ctx, () => this.logInEmployeeImpl(ctx.request.body.username, ctx.request.body.password));
        });
    }

    logInClientDevice(): any {
        return route.post(this.apiPrefix + 'login-device', async ctx => {
            await this.handleActionResult(ctx, () => this.logInClientDeviceImpl(ctx.request.body.clientId));
        });
    }

    checkAuthorization() {
        return this.checkAuthorizationImpl.bind(this);
    }

    private async logInClientDeviceImpl(clientId: string): Promise<IRouteActionResult<IToken> | void> {
        const device = await this.storageProvider.getClientDevice(clientId);
        if (!device.approved) {
            return { error: { message: 'Not approved' }, status: 401 };
        }

        // Create token object for crypting including mapped permissions
        const token = await this.generateToken(
            clientId,
            'client-device',
            [this.permissionsMapper.permissionIds.clientDeviceFullAccess]
        );
        return { value: token };
    }

    private async checkAuthorizationImpl(ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const authHeaderValue = <string>ctx.headers.authorization;
        const tokenString = authHeaderValue.split(' ')[1];
        const tokenObj = await this.verifyToken(tokenString);
        // Set token into request context in order to be available for all other middlewares
        // TODO It is already available in ctx.state.user - set by jsonwebtoken module
        ctx.state.token = tokenObj;
        if (!tokenObj) {
            return ctx.throw(401);
        }
        const allowingPermissions = this.getAllowingPermissions(ctx.method, ctx.path);
        if (allowingPermissions.length === 0) {
            // Can't find permission for that method and url path - don't allow execution
            return ctx.throw(this.errorMessage.create('URL forbidden'), 403);
        }
        const hasAnyPermission = this.permissionsMapper.hasAnyPermission(allowingPermissions, tokenObj.permissions);
        if (!hasAnyPermission) {
            return ctx.throw(this.errorMessage.create('No permission'), 403);
        }
        return next();
    }

    private async generateToken(
        accountId: string,
        type: 'employee' | 'client-device',
        allPermissionIds: string[]
    ): Promise<IToken> {
        // Create token object for crypting including mapped permissions
        const serverToken: IServerToken = <IServerToken>{};
        serverToken.accountId = accountId;
        serverToken.type = type;
        serverToken.permissions = this.permissionsMapper.mapToBinaryString(allPermissionIds);
        const tokenSecret = this.tokenSecret || await this.getTokenSecret();
        // Use UTC time
        const expiresIn = await this.getTokenDuration();
        const tokenString = jwt.sign(serverToken, tokenSecret || '', { expiresIn: expiresIn });

        // Create token for the client application
        const result: IToken = {
            token: tokenString,
            expiresIn: expiresIn,
            permissions: serverToken.permissions
        };
        return result;
    }

    /**
     * Returns array with permissions allowing access to a given method and URL
     * @param method Koa context method
     * @param urlPath Koa context path
     */
    private getAllowingPermissions(method: string, urlPath: string): string[] {
        const pids = this.permissionsMapper.permissionIds;
        if (this.apiPathIs(urlPath, 'client-devices')) {
            return this.selectPermissionsIds(method, [pids.clientDevicesView], [pids.clientDevicesModify]);
        }
        if (this.apiPathIs(urlPath, 'employees-with-roles')) {
            return this.selectPermissionsIds(method, [pids.employeesView], [pids.employeesModify]);
        }
        if (this.apiPathIs(urlPath, 'employees')) {
            return this.selectPermissionsIds(method, [pids.employeesView], [pids.employeesModify]);
        }
        if (this.apiPathIs(urlPath, 'roles-with-permissions-ids')) {
            return this.selectPermissionsIds(method, [pids.rolesView], [pids.rolesModify]);
        }
        if (method === 'GET' && urlPath.startsWith(this.apiPrefix + 'roles')) {
            return [pids.employeesView, pids.rolesView];
        }
        if (this.apiPathIs(urlPath, 'permissions')) {
            return this.selectPermissionsIds(method, [pids.permissionsView], [pids.permissionsModify]);
        }
        if (urlPath.startsWith(this.apiPrefix + 'client-devices-status')) {
            if (method === 'GET') {
                return [pids.clientDevicesStatusView];
            }
            if (method === 'POST') {
                return [pids.clientDevicesStatusModify];
            }
        }
        if (urlPath.startsWith(this.apiPrefix + 'client-device-current-data')) {
            return [pids.clientDeviceFullAccess];
        }

        return [];
    }

    /**
     * Returns true if given Koa context pat starts with API prefix followed by specific suffix
     * @param path Koa context path
     * @param value Endpoint value after API prefix
     */
    private apiPathIs(path: string, value: string): boolean {
        return path.startsWith(this.apiPrefix + value);
    }

    /**
     * Returns required permission for a given method
     * @param method Koa ontext method
     * @param viewPermissionId Permision id necessary to view the resource when method is GET
     * @param modifyPermissionId Permission id necessary to modify the resource when method is POST
     */
    private selectPermissionsIds(method: string, viewPermissionsIds: string[], modifyPermissionsIds: string[]): string[] {
        return (method === 'GET') ? viewPermissionsIds : (method === 'POST') ? modifyPermissionsIds : [];
    }

    private async verifyToken(token: string): Promise<IServerToken> {
        const tokenSecret = this.tokenSecret || await this.getTokenSecret();
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

    private async logInEmployeeImpl(username: string, password: string): Promise<IRouteActionResult<IToken> | void> {
        const userWithPermissions = await this.storageProvider
            .getEmployeeWithRolesAndPermissions(username, password);
        if (!userWithPermissions.employee) {
            // This employee was not found
            return { status: 401 };
        }
        if (userWithPermissions.employee.disabled) {
            // This employee is disabled
            return { error: { message: 'Disabled' }, status: 401 };
        }

        // Get all permissions from all employee roles
        const allPermissionIds: string[] = [];
        for (let i = 0; i < userWithPermissions.rolesWithPermissions.length; i++) {
            const permissions = userWithPermissions.rolesWithPermissions[i].permissions;
            allPermissionIds.push(...permissions.map(x => x.id));
        }
        // Create token object for crypting including mapped permissions
        const token = await this.generateToken(
            userWithPermissions.employee.id,
            'employee',
            allPermissionIds
        );
        return { value: token };
    }

    private async getTokenSecret(): Promise<string | null> {
        // if (this.tokenSecret) {
        //     return Promise.resolve(this.tokenSecret);
        // }
        this.tokenSecret = await this.storageProvider.getTokenSecret();
        return this.tokenSecret;
    }

    private getTokenDuration(): Promise<number> {
        // Token expires in 24 hours
        // TODO Implement refresh tokens and shorten primary token lifetime to 5 minutes or so
        return Promise.resolve(24 * 60 * 60);
    }
}
