import { IWebSocketData } from '../../../../shared/interfaces/web-socket/web-socket-data';
import { WebSocketMessageName } from '../../../../shared/web-socket-message-name';

export class WebSocketUtilsService {
    matchesMessage(msg: IWebSocketData, messageName: WebSocketMessageName, deviceId: string): boolean {
        if (!msg.sender) {
            return false;
        }
        if (msg.name === messageName && deviceId && msg.sender.deviceId === deviceId) {
            // This data is for the selected device
            return true;
        }
        return false;
    }
}
