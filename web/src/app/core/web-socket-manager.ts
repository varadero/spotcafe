import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

export class WebSocketManager {
    private fullUrl: string;
    private reconnectOnClose: boolean;
    private reconnectOnError: boolean;
    private ws: WebSocket;
    private ws$: Subject<IWebSocketEventArgs>;
    private wsObservable: Observable<IWebSocketEventArgs>;
    private reconnectDelay = 3000;
    private reconnectTimeoutHandle: number;
    private pingDelay = 100;
    private pingIntervalHandle: number;

    constructor() {
        this.ws$ = new Subject<IWebSocketEventArgs>();
        this.wsObservable = this.ws$.asObservable();
    }

    connect(baseUrl: string, token: string, reconnectOnClose: boolean, reconnectOnError: boolean): Observable<IWebSocketEventArgs> {
        this.reconnectOnClose = reconnectOnClose;
        this.reconnectOnError = reconnectOnError;
        this.fullUrl = baseUrl + '?token=' + encodeURIComponent(token);
        this.ws = this.connectWebSocket();
        return this.wsObservable;
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
        return ws;
    }

    private send(data: IWebSocketData): void {
        try {
            this.ws.send(JSON.stringify(data));
        } catch (err) {
        }
    }

    private startPinging(): void {
        this.stopPinging();
        this.pingIntervalHandle = window.setInterval(() => {
            this.send({ name: 'ping', data: null });
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

export interface IWebSocketData {
    name: 'ping';
    data: any;
}


