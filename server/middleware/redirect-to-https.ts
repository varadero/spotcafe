import { IncomingMessage, ServerResponse } from 'http';

export function redirectToHttps(port: number) {
    return function (req: IncomingMessage, res: ServerResponse) {
        const redirectLocation = `https://${req.headers.host}:${port}${req.url}`;
        res.setHeader('Location', redirectLocation);
        res.statusCode = 301;
        res.end();
    };
}
