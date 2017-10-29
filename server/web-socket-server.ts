import * as http from 'http';
import * as https from 'https';
import * as ws from 'ws';
import * as url from 'url';
import * as jwt from 'jsonwebtoken';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { IServerToken } from './routes/interfaces/server-token';

export class WebSocketServer {
    private wsServer: ws.Server;
    private evt$: Subject<IWebSocketEventData>;
    private evtObs: Observable<IWebSocketEventData>;
    private msg$: Subject<IWebSocketMessageData>;
    private msgObs: Observable<IWebSocketMessageData>;

    constructor(private tokenSecret: string) {
        this.evt$ = new Subject<IWebSocketEventData>();
        this.evtObs = this.evt$.asObservable();
        this.msg$ = new Subject<IWebSocketMessageData>();
        this.msgObs = this.msg$.asObservable();
    }

    startServer(httpServer: https.Server | http.Server): void {
        this.wsServer = new ws.Server({
            server: httpServer,
            path: '/api/websocket',
            verifyClient: this.verifyWebSocketClient.bind(this)
        });
        this.wsServer.on('error', err => {
            const errorEventData: IWebSocketServerEventErrorData = { wsServer: this.wsServer, error: err };
            this.evt$.next({ name: EventName.error, data: errorEventData });
        });
        this.wsServer.on('connection', (socket: ws, request: http.IncomingMessage) => {
            if (request) { }
            const connectionEventData: IWebSocketServerEventConnectionData = {
                socket: socket,
                token: this.getTokenFromWebSocketUrl(request.url || '')
            };
            this.evt$.next({ name: EventName.connection, data: connectionEventData });
            socket.on('error', err => {
                const errorEventData: IWebSocketEventErrorData = { socket: socket, error: err };
                this.evt$.next({ name: EventName.socketError, data: errorEventData });
            });
            socket.on('close', (code, reason) => {
                const closeEventData: IWebSocketEventCloseData = { socket: socket, code: code, reason: reason };
                this.evt$.next({ name: EventName.socketClose, data: closeEventData });
            });
            socket.on('message', (data: any) => {
                const messageEvenData: IWebSocketMessageData = { socket: socket, data: data };
                this.msg$.next(messageEvenData);
            });
        });
    }

    send(socket: ws, name: string, data: any): void {
        if (!socket) {
            return;
        }
        try {
            socket.send(JSON.stringify({ name: name, data: data }));
        } catch (err) { }
    }

    getMessageReceivedObservable(): Observable<IWebSocketMessageData> {
        return this.msgObs;
    }

    getSocketEventObservable(): Observable<IWebSocketEventData> {
        return this.evtObs;
    }

    private getTokenFromWebSocketUrl(urlValue: string): string {
        if (!urlValue) {
            return '';
        }
        try {
            const parsedUrl = url.parse(urlValue, true);
            return parsedUrl.query.token;
        } catch (err) {
            return '';
        }
    }

    private verifyWebSocketClient(
        info: { origin: string; secure: boolean; req: http.IncomingMessage },
        callback: (res: boolean, code?: number, message?: string) => void
    ): void {
        const tokenString = this.getTokenFromWebSocketUrl(info.req.url || '');
        if (!tokenString) {
            this.evt$.next({
                name: EventName.authentiactionFailed,
                data: {
                    origin: info.origin,
                    secure: info.secure,
                    request: info.req
                }
            });
            callback(false, 403, 'Token not provided');
            return;
        }
        try {
            const serverToken = <IServerToken>jwt.verify(tokenString, this.tokenSecret);
            const authSuccData: IWebSocketServerEventAuthenticationSuccededData = {
                serverToken: serverToken,
                tokenString: tokenString
            };
            this.evt$.next({ name: EventName.authenticationSucceeded, data: authSuccData });
            callback(true);
        } catch (err) {
            this.evt$.next({ name: EventName.tokenVerificationError, data: err });
        }
    }
}

export interface IWebSocketMessageData {
    socket: ws;
    data: any;
}

export interface IWebSocketServerEventConnectionData {
    socket: ws;
    token: string;
}

export interface IWebSocketEventCloseData {
    socket: ws;
    code: number;
    reason: string;
}

export interface IWebSocketEventErrorData {
    socket: ws;
    error: Error;
}

export interface IWebSocketServerEventErrorData {
    wsServer: ws.Server;
    error: Error;
}

export interface IWebSocketServerEventAuthenticationSuccededData {
    serverToken: IServerToken;
    tokenString: string;
}

export interface IWebSocketEventData {
    name: EventName;
    data: any;
}

export enum EventName {
    connection = 'connection',
    error = 'error',
    socketError = 'socket-error',
    socketClose = 'socket-close',
    authentiactionFailed = 'authentiaction-failed',
    authenticationSucceeded = 'authentication-succeeded',
    tokenVerificationError = 'token-verification-error'
}
