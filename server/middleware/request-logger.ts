import * as Koa from 'koa';

import { Logger } from '../utils/logger';

export function requestLogger(logger: Logger): any {
    return async function (ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const start = new Date().getTime();
        try {
            await next();
        } finally {
            let msg = 'REQUEST ' + (<any>ctx).ip + ' ' + ctx.method + ' ' + ctx.originalUrl + ' ' + ctx.status;
            const end = new Date().getTime();
            msg += ' ' + `${end - start} ${ctx.message}`;
            logger.log(msg);
        }
    };
}
