import { WebSocketMessageName, WebSocketMessageErrorNumber } from '../../web-socket-message-name';
import { ISenderData } from '../../interfaces/web-socket/sender-data';

export interface IWebSocketData {
    name: WebSocketMessageName;
    targetDeviceId: string;
    payload?: IWebSocketPayload;
    sender?: ISenderData;
}

export interface IWebSocketPayload {
    data: any;
    error?: IWebSocketPayloadError;
}

export interface IWebSocketPayloadError {
    message: string;
    number: WebSocketMessageErrorNumber | number;
}
