import { WebSocketMessageName } from '../../web-socket-message-name';

export interface IWebSocketData {
    name: WebSocketMessageName;
    data: any;
}
