import * as http from 'http';
import * as https from 'https';
import * as ws from 'ws';
import * as url from 'url';
import * as jwt from 'jsonwebtoken';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IServerToken } from './routes/interfaces/server-token';
import { Logger } from './utils/logger';

export class WebSocketServer {
    private wsServer: ws.Server;
    private msg$: Subject<IWebSocketMessageData>;

    constructor(private tokenSecret: string, private logger: Logger) {
        this.msg$ = new Subject<IWebSocketMessageData>();
    }

    startServer(httpServer: https.Server | http.Server): Observable<IWebSocketMessageData> {
        this.wsServer = new ws.Server({
            server: httpServer,
            path: '/api/websocket',
            verifyClient: this.verifyWebSocketClient.bind(this)
        });
        this.wsServer.on('error', err => {
            this.logger.error('WS Error', err);
        });
        this.wsServer.on('connection', (socket: ws, request: http.IncomingMessage) => {
            this.logger.log('WS Connected', request.connection.remoteAddress);
            socket.on('disconnect', () => {
                this.logger.log('WS Disconnected');
            });
            socket.on('message', (data: any) => {
                this.msg$.next(<IWebSocketMessageData>{ socket: socket, data: data });
                socket.send(JSON.stringify({ name: 'get-folder-content', data: 'C:\\Windows' }));
            });
        });
        return this.msg$.asObservable();
    }

    private verifyWebSocketClient(
        info: { origin: string; secure: boolean; req: http.IncomingMessage },
        callback: (res: boolean, code?: number, message?: string) => void
    ): void {
        const tokenString = this.getTokenFromWebSocketUrl(info.req.url || '');
        if (!tokenString) {
            callback(false, 403, 'Token not provided');
            return;
        }
        try {
            const verifyTokenResult = <IServerToken>jwt.verify(tokenString, this.tokenSecret);
            this.logger.log(
                'WS Authenticated',
                info.req.connection.remoteAddress,
                verifyTokenResult.accountId,
                verifyTokenResult.deviceId,
                verifyTokenResult.type,
                verifyTokenResult.exp
            );
            callback(true);
        } catch (err) {
            this.logger.error(`WS Token invalid: ${tokenString}`, err);
        }
    }

    private getTokenFromWebSocketUrl(urlValue: string): string | null {
        if (!urlValue) {
            return null;
        }
        try {
            const parsedUrl = url.parse(urlValue, true);
            return parsedUrl.query.token;
        } catch (err) {
            return null;
        }
    }
}

export interface IWebSocketMessageData {
    socket: ws;
    data: any;
}
