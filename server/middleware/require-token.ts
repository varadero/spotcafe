import * as koaJwt from 'koa-jwt';

export function requireToken(options: IAuthOptons): koaJwt.Middleware {
    return koaJwt({ secret: options.secret });
}

export interface IAuthOptons {
    secret: string;
}
