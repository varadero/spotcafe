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
import { WebSocketMessageName } from '../shared/web-socket-message-name';
import { IGetDrivesRequest } from '../shared/interfaces/web-socket/get-drives-request';
import { ISenderData } from '../shared/interfaces/web-socket/sender-data';

export class WebSocketActions {
    private socketsInfo: ISocketInfo[];

    constructor(private wss: WebSocketServer, private storageProvider: StorageProvider) {
        if (this.storageProvider) { }
        this.socketsInfo = [];
        this.subscribe();
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
            json = <IClientWebSocketData>JSON.parse(value.data);
        } catch (err) { }

        if (json) {
            this.handleMessage(value.socket, json);
        }
    }

    private handleMessage(socket: ws, receivedData: IClientWebSocketData): void {
        const callerInfo = this.getInfoBySocket(socket);
        if (!callerInfo) {
            return;
        }
        const name = receivedData.name;
        const data = receivedData.data;
        if (name === WebSocketMessageName.ping) {
            this.handlePingMessage(callerInfo);
        } else if (name === WebSocketMessageName.getDrivesRequest) {
            this.handleGetDrivesRequestMessage(callerInfo, data);
        } else if (name === WebSocketMessageName.getDrivesResponse) {
            this.handleGetDrivesResponseMessage(callerInfo, data);
        }
    }

    private handleGetDrivesResponseMessage(callerInfo: ISocketInfo, data: any): void {
        // Find who asked for this request and send the response to all of them
        const getDrivesRequestCallers = this.getInfosByRequestData(
            WebSocketMessageName.getDrivesRequest,
            callerInfo.serverToken.deviceId,
            null
        );
        if (getDrivesRequestCallers) {
            for (const getDrivesCaller of getDrivesRequestCallers) {
                // Remove not fullfilled request because now it will be fullfilled
                this.removeNotFullfilledRequest(
                    getDrivesCaller,
                    WebSocketMessageName.getDrivesRequest,
                    callerInfo.serverToken.deviceId,
                    null
                );
                this.wss.send(
                    getDrivesCaller.socket,
                    WebSocketMessageName.getDrivesResponse,
                    <ISenderData>{ deviceId: callerInfo.serverToken.deviceId },
                    data
                );
            }
        }
    }

    private handlePingMessage(callerInfo: ISocketInfo): void {
        callerInfo.lastPing = Date.now();
    }

    private handleGetDrivesRequestMessage(callerInfo: ISocketInfo, data: any): void {
        // Find for which device id is the request
        const getDrivesReq = <IGetDrivesRequest>data;
        if (getDrivesReq.deviceId) {
            const infoByDeviceId = this.getInfoByDeviceId(getDrivesReq.deviceId);
            if (infoByDeviceId) {
                // Send message to target device
                callerInfo.notFullfilledRequests.push({
                    data: data,
                    deviceId: getDrivesReq.deviceId,
                    name: WebSocketMessageName.getDrivesRequest,
                    requestedAt: Date.now()
                });
                this.wss.send(infoByDeviceId.socket, WebSocketMessageName.getDrivesRequest, null, null);
            }
        }
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

export interface IClientWebSocketData {
    name: WebSocketMessageName;
    data: any;
}
