import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';

export function notFound(options: INotFoundOptions): any {
    // TODO Make it async - look at https://github.com/evheniy/koa-2-error-handler/blob/master/lib/error.js
    return function (ctx: Koa.Context, next: () => Promise<any>): any {
        if (ctx.method !== 'GET') {
            // Only GET requests are processed
            return next();
        }
        if (options.ignorePrefix && ctx.path.startsWith(options.ignorePrefix)) {
            return next();
        }

        const requestedPath = path.join(options.root, ctx.path);
        if (!fs.existsSync(requestedPath)) {
            ctx.response.append('Content-Type', 'text/html');
            ctx.body = fs.readFileSync(path.join(options.root, options.serve));
            return;
        } else {
            return next();
        }
    };
}

export interface INotFoundOptions {
    root: string;
    serve: string;
    ignorePrefix?: string;
}
