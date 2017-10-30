import { WebSocketMessageName } from '../../web-socket-message-name';
import { ISenderData } from './sender-data';

export interface IWebSocketData {
    name: WebSocketMessageName;
    sender: ISenderData | null;
    data: any;
}
