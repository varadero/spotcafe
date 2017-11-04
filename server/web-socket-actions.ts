import * as ws from 'ws';

import {
    WebSocketServer,
    IWebSocketMessageData,
    IWebSocketEventData,
    IWebSocketServerEventAuthenticationSuccededData,
    IWebSocketServerEventConnectionData,
    IWebSocketEventCloseData,
    EventName
} from './web-socket-server';
import { StorageProvider } from './storage/storage-provider';
import { IServerToken } from './routes/interfaces/server-token';
import { WebSocketMessageName, WebSocketMessageErrorNumber } from '../shared/web-socket-message-name';
import { IWebSocketData, IWebSocketPayload } from '../shared/interfaces/web-socket/web-socket-data';
// import { IGetDrivesRequest } from '../shared/interfaces/web-socket/get-drives-request';
import { ISenderData } from '../shared/interfaces/web-socket/sender-data';
import { IGetFolderItemsRequest } from '../shared/interfaces/web-socket/get-folder-items-request';

export class WebSocketActions {
    private socketsInfo: ISocketInfo[];

    constructor(private wss: WebSocketServer, private storageProvider: StorageProvider) {
        if (this.storageProvider) { }
        this.socketsInfo = [];
        this.subscribe();
    }

    sendToDevice(deviceId: string, messageName: WebSocketMessageName, data: any): void {
        const socketInfo = this.getInfoByDeviceId(deviceId);
        if (!socketInfo) {
            return;
        }
        this.wss.sendToDevice(socketInfo.socket, messageName, data);
    }

    private handleSocketEvent(value: IWebSocketEventData): void {
        if (value.name === EventName.authenticationSucceeded) {
            const authSuccData = <IWebSocketServerEventAuthenticationSuccededData>value.data;
            // Add item - it will be later merged when 'connection' event is received
            const authSocketInfo = <ISocketInfo>{
                serverToken: authSuccData.serverToken,
                token: authSuccData.tokenString
            };
            this.setInfo(authSocketInfo);
        } else if (value.name === EventName.connection) {
            const connData = <IWebSocketServerEventConnectionData>value.data;
            const connSocketInfo = <ISocketInfo>{
                socket: connData.socket,
                token: connData.token
            };
            this.setInfo(connSocketInfo);
        } else if (value.name === EventName.socketClose) {
            const closeData = <IWebSocketEventCloseData>value.data;
            this.removeInfoBySocket(closeData.socket);
        } else if (value.name === EventName.socketError) {
        }
    }

    private handleMessageReceived(value: IWebSocketMessageData): void {
        let json = null;
        try {
            json = <IWebSocketData>JSON.parse(value.data);
        } catch (err) { }

        if (json) {
            this.handleMessage(value.socket, json);
        }
    }

    private handleMessage(socket: ws, receivedData: IWebSocketData): void {
        const callerInfo = this.getInfoBySocket(socket);
        if (!callerInfo) {
            return;
        }
        const targetDeviceId = receivedData.targetDeviceId;
        const name = receivedData.name;
        const data = receivedData.payload;
        if (name === WebSocketMessageName.ping) {
            this.handlePingMessage(callerInfo);
        } else if (name === WebSocketMessageName.getDrivesRequest) {
            this.handleGetDrivesRequestMessage(callerInfo, targetDeviceId, data);
        } else if (name === WebSocketMessageName.getDrivesResponse) {
            this.handleGetDrivesResponseMessage(callerInfo, data);
        } else if (name === WebSocketMessageName.getFolderItemsRequest) {
            this.handleGetFolderItemsRequestMessage(callerInfo, targetDeviceId, data);
        } else if (name === WebSocketMessageName.getFolderItemsResponse) {
            this.handleGetFolderItemsResponseMessage(callerInfo, data);
        }
    }

    private handleGetFolderItemsResponseMessage(callerInfo: ISocketInfo, payload?: IWebSocketPayload): void {
        const requestCallers = this.getInfosByRequestData(
            WebSocketMessageName.getFolderItemsRequest,
            callerInfo.serverToken.deviceId,
            null
        );
        if (!requestCallers) {
            return;
        }
        for (const getCaller of requestCallers) {
            // Remove not fullfilled request because now it will be fullfilled
            this.removeNotFullfilledRequest(
                getCaller,
                WebSocketMessageName.getFolderItemsRequest,
                callerInfo.serverToken.deviceId,
                null
            );
            this.wss.sendToWebClient(
                getCaller.socket,
                WebSocketMessageName.getFolderItemsResponse,
                <ISenderData>{ deviceId: callerInfo.serverToken.deviceId },
                payload
            );
        }
    }

    private handleGetFolderItemsRequestMessage(callerInfo: ISocketInfo, targetDeviceId: string, payload?: IWebSocketPayload): void {
        if (!targetDeviceId) {
            return;
        }
        if (!payload || !payload.data) {
            return;
        }
        const infoByDeviceId = this.getInfoByDeviceId(targetDeviceId);
        if (!infoByDeviceId) {
            this.sendDeviceNotFound(callerInfo.socket);
            return;
        }
        const getFolderItemsReq = <IGetFolderItemsRequest>payload.data;
        // Send message to target device
        callerInfo.notFullfilledRequests.push({
            data: getFolderItemsReq,
            deviceId: targetDeviceId,
            name: WebSocketMessageName.getFolderItemsRequest,
            requestedAt: Date.now()
        });
        this.wss.sendToDevice(infoByDeviceId.socket, WebSocketMessageName.getFolderItemsRequest, payload);
    }

    private handleGetDrivesResponseMessage(callerInfo: ISocketInfo, payload?: IWebSocketPayload): void {
        // Find who asked for this request and send the response to all of them
        const getDrivesRequestCallers = this.getInfosByRequestData(
            WebSocketMessageName.getDrivesRequest,
            callerInfo.serverToken.deviceId,
            null
        );
        if (!getDrivesRequestCallers) {
            return;
        }
        for (const getDrivesCaller of getDrivesRequestCallers) {
            // Remove not fullfilled request because now it will be fullfilled
            this.removeNotFullfilledRequest(
                getDrivesCaller,
                WebSocketMessageName.getDrivesRequest,
                callerInfo.serverToken.deviceId,
                null
            );
            this.wss.sendToWebClient(
                getDrivesCaller.socket,
                WebSocketMessageName.getDrivesResponse,
                <ISenderData>{ deviceId: callerInfo.serverToken.deviceId },
                payload
            );
        }
    }

    private handleGetDrivesRequestMessage(callerInfo: ISocketInfo, targetDeviceId: string, payload?: IWebSocketPayload): void {
        if (!targetDeviceId) {
            return;
        }
        const infoByDeviceId = this.getInfoByDeviceId(targetDeviceId);
        if (!infoByDeviceId) {
            this.sendDeviceNotFound(callerInfo.socket);
            return;
        }
        // Send message to target device
        callerInfo.notFullfilledRequests.push({
            data: payload ? payload.data : null,
            deviceId: targetDeviceId,
            name: WebSocketMessageName.getDrivesRequest,
            requestedAt: Date.now()
        });
        this.wss.sendToDevice(infoByDeviceId.socket, WebSocketMessageName.getDrivesRequest);
    }

    private createDeviceNotConnectedErrorResponse() {
        return this.createErrorResponse(
            'Device not connected',
            WebSocketMessageErrorNumber.deviceNotConnected,
            null
        );
    }

    private sendDeviceNotFound(socket: ws): void {
        this.wss.sendToWebClient(
            socket,
            WebSocketMessageName.getFolderItemsResponse,
            null,
            this.createDeviceNotConnectedErrorResponse()
        );
    }

    private createErrorResponse(
        message: string,
        number: number,
        data: any
    ): IWebSocketPayload {
        const result = <IWebSocketPayload>{
            data: data,
            error: {
                number: number,
                message: message
            }
        };
        return result;
    }


    private handlePingMessage(callerInfo: ISocketInfo): void {
        callerInfo.lastPing = Date.now();
    }

    private subscribe(): void {
        this.wss.getMessageReceivedObservable().subscribe(value => {
            this.handleMessageReceived(value);
        });
        this.wss.getSocketEventObservable().subscribe(value => {
            this.handleSocketEvent(value);
        });
    }

    private setInfo(info: ISocketInfo): void {
        const infoBySocket = this.getInfoBySocket(info.socket);
        if (infoBySocket) {
            this.mergeInfos(infoBySocket, info);
            return;
        }
        const infoByToken = this.getInfoByToken(info.token);
        if (infoByToken) {
            this.mergeInfos(info, infoByToken);
            return;
        }

        if (!info.notFullfilledRequests) {
            info.notFullfilledRequests = [];
        }
        this.socketsInfo.push(info);
    }

    private removeInfoBySocket(socket: ws): void {
        const index = this.socketsInfo.findIndex(x => x.socket === socket);
        if (index >= 0) {
            this.socketsInfo.splice(index, 1);
        }
    }

    private removeNotFullfilledRequest(info: ISocketInfo, requestName: WebSocketMessageName, deviceId: string, data: any): void {
        const dataAsJson = data ? JSON.stringify(data) : null;
        const index = this.findNotFullfilledRequestIndex(info, requestName, deviceId, dataAsJson);
        if (index >= 0) {
            info.notFullfilledRequests.splice(index, 1);
        }
    }

    private mergeInfos(source: ISocketInfo, destination: ISocketInfo): ISocketInfo {
        const propNames = Object.getOwnPropertyNames(source);
        for (const propName of propNames) {
            (<any>destination)[propName] = (<any>source)[propName];
        }
        return destination;
    }

    private getInfoBySocket(socket: ws): ISocketInfo | null {
        return this.socketsInfo.find(x => x.socket === socket) || null;
    }

    private getInfoByToken(token: string): ISocketInfo | null {
        return this.socketsInfo.find(x => x.token === token) || null;
    }

    private getInfoByDeviceId(deviceId: string): ISocketInfo | null {
        return this.socketsInfo.find(x => x.serverToken.deviceId === deviceId) || null;
    }

    private getInfosByRequestData(requestName: WebSocketMessageName, deviceId: string, data: any): ISocketInfo[] | null {
        const result: ISocketInfo[] = [];
        const dataAsJson = data ? JSON.stringify(data) : null;
        for (const info of this.socketsInfo) {
            if (this.findNotFullfilledRequestIndex(info, requestName, deviceId, dataAsJson) >= 0) {
                result.push(info);
            }
        }
        if (result.length === 0) {
            return null;
        }
        return result;
    }

    private findNotFullfilledRequestIndex(
        info: ISocketInfo,
        requestName: WebSocketMessageName,
        deviceId: string,
        dataAsJson: string | null
    ): number {
        const result = info.notFullfilledRequests.findIndex(x => {
            if (dataAsJson && dataAsJson !== JSON.stringify(x.data)) {
                return false;
            }
            const matches = x.name === requestName && x.deviceId === deviceId;
            return matches;
        });
        return result;
    }
}

interface ISocketInfo {
    socket: ws;
    serverToken: IServerToken;
    token: string;
    accountId: string;
    lastPing: number;
    notFullfilledRequests: INotFullfilledRequests[];
}

interface INotFullfilledRequests {
    name: WebSocketMessageName;
    deviceId: string;
    data: any;
    requestedAt: number;
}
