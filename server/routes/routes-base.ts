import * as Koa from 'koa';

import { IRouteActionResult } from './interfaces/route-action-result';
import { ErrorMessage } from '../utils/error-message';
import { IServerToken } from './interfaces/server-token';

export class RoutesBase {
    protected errorMessage = new ErrorMessage();

    async handleActionResult<T>(
        ctx: Koa.Context,
        action: () => Promise<IRouteActionResult<T> | void>
    ): Promise<IRouteActionResult<T> | void> {
        let result: IRouteActionResult<T> | void;
        try {
            result = await action();
            if (result) {
                if (!result.error) {
                    ctx.body = result.value;
                    ctx.status = result.status || 200;
                }
            } else {
                ctx.status = 200;
            }
        } catch (err) {
            return ctx.throw(500);
        }

        if (result && result.error) {
            const status = result.error.number || 500;
            const message = this.errorMessage.create(result.error.message || '');
            ctx.status = status;
            ctx.message = result.error.message;
            return ctx.throw(status, message);
        }

        return result;
    }

    async handleResult<T>(ctx: Koa.Context, action: () => Promise<T | void>): Promise<T | void> {
        try {
            const result = await action();
            if (result) {
                ctx.body = result;
            }
            ctx.status = 200;
            return result;
        } catch (err) {
            if (err && err.status) {
                ctx.status = err.status;
                return ctx.throw(err.status);
            } else {
                ctx.status = 500;
                return ctx.throw(500);
            }
        }
    }

    throwContextError(ctx: Koa.Context, status: number, message?: string): any {
        const msg = this.errorMessage.create(message || '');
        ctx.status = status;
        ctx.throw(status, msg);
    }

    getServerToken(ctx: Koa.Context): IServerToken {
        return ctx.state.user;
    }

    isServerTokenEmployee(serverToken: IServerToken): boolean {
        return (serverToken.type === 'employee');
    }

    isServerTokenClient(serverToken: IServerToken): boolean {
        return (serverToken.type === 'client');
    }

    isServerTokenClientDevice(serverToken: IServerToken): boolean {
        return (serverToken.type === 'client-device');
    }
}
