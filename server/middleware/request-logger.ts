import * as Koa from 'koa';

import { Logger } from '../utils/logger';

export function requestLogger(logger: Logger): any {
    return async function (ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const start = new Date().getTime();
        await next();
        const end = new Date().getTime();
        let msg = (<any>ctx).ip + ' ' + ctx.method + ' ' + ctx.originalUrl + ' ' + ctx.status + ' ' + ctx.message;
        msg += ' ' + `${end - start}ms`;
        logger.log(msg);
    };
}
