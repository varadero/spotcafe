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
            return ctx.throw(this.errorMessage.create(result.error.message || ''), result.error.number || 500);
        }

        return result;
    }

    async handleResult<T>(ctx: Koa.Context, action: () => Promise<T | void>): Promise<T | void> {
        try {
            const result = await action();
            if (result) {
                ctx.body = result;
            } else {
                ctx.status = 200;
            }
            return result;
        } catch (err) {
            if (err && err.status) {
                return ctx.throw(err.status);
            } else {
                return ctx.throw(500);
            }
        }
    }

    getServerToken(ctx: Koa.Context): IServerToken {
        return ctx.state.token;
    }
}
