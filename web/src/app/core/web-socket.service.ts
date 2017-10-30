import { Subject } from 'rxjs/Subject';

import { WebSocketMessageName } from '../../../../shared/web-socket-message-name';
import { IWebSocketData } from '../../../../shared/interfaces/web-socket/web-socket-data';

export class WebSocketService {
    private fullUrl: string;
    private reconnectOnClose: boolean;
    private reconnectOnError: boolean;
    private ws: WebSocket;
    private ws$: Subject<IWebSocketEventArgs>;
    private reconnectDelay = 3000;
    private reconnectTimeoutHandle: number;
    private pingDelay = 10000;
    private pingIntervalHandle: number;

    constructor() {
        this.ws$ = new Subject<IWebSocketEventArgs>();
    }

    getSubject(): Subject<IWebSocketEventArgs> {
        return this.ws$;
    }

    connect(baseUrl: string, token: string, reconnectOnClose: boolean, reconnectOnError: boolean): void {
        this.reconnectOnClose = reconnectOnClose;
        this.reconnectOnError = reconnectOnError;
        this.fullUrl = baseUrl + '?token=' + encodeURIComponent(token);
        this.ws = this.connectWebSocket();
    }

    send(data: IWebSocketData): void {
        try {
            this.ws.send(JSON.stringify(data));
        } catch (err) {
        }
    }

    close(): void {
        this.dispose();
    }

    private connectWebSocket(): WebSocket {
        const ws = new WebSocket(this.fullUrl);
        ws.onopen = e => {
            this.startPinging();
            this.ws$.next({ name: 'open', data: e });
        };
        ws.onmessage = e => {
            this.ws$.next({ name: 'message', data: e });
        };
        ws.onerror = e => {
            this.ws$.next({ name: 'error', data: e });
            if (this.reconnectOnError) {
                this.reconnect();
            }
        };
        ws.onclose = e => {
            this.ws$.next({ name: 'close', data: e });
            this.stopPinging();
            if (this.reconnectOnClose) {
                this.reconnect();
            }
        };
        this.ws = ws;
        return ws;
    }

    private startPinging(): void {
        this.stopPinging();
        this.pingIntervalHandle = window.setInterval(() => {
            this.send({ name: WebSocketMessageName.ping, sender: null, data: null });
        }, this.pingDelay);
    }

    private stopPinging(): void {
        window.clearInterval(this.pingIntervalHandle);
    }

    private reconnect(): void {
        this.stopPinging();
        window.clearTimeout(this.reconnectTimeoutHandle);
        this.reconnectTimeoutHandle = window.setTimeout(() => {
            this.dispose();
            this.connectWebSocket();
        }, this.reconnectDelay);
    }

    private dispose(): void {
        try {
            this.stopPinging();
            if (this.ws) {
                this.ws.onclose = <any>null;
                this.ws.onerror = <any>null;
                this.ws.onmessage = <any>null;
                this.ws.onopen = <any>null;
                this.ws.close();
                this.ws = <any>null;
            }
        } catch (err) {
        }
    }
}

export interface IWebSocketEventArgs {
    name: 'open' | 'message' | 'error' | 'close';
    data: any;
}
