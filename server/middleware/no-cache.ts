import * as Koa from 'koa';

export function noCache(): any {
    return function (ctx: Koa.Context, next: () => Promise<any>): any {
        ctx.set('Cache-Control', 'no-store, must-revalidate');
        return next();
    };
}
