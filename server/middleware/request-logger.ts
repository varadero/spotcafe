import * as Koa from 'koa';

import { Logger } from '../utils/logger';

export function requestLogger(logger: Logger): any {
    return async function (ctx: Koa.Context, next: () => Promise<any>): Promise<any> {
        const start = new Date().getTime();
        let msg: string;
        try {
            await next();
        } finally {
            msg = (<any>ctx).ip + ' ' + ctx.method + ' ' + ctx.originalUrl + ' ' + ctx.status + ' ' + ctx.message;
            const end = new Date().getTime();
            msg += ' ' + `${end - start}ms`;
            logger.log(msg);
        }
    };
}
