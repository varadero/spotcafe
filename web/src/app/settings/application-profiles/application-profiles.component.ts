import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { DataService } from '../../core/data.service';
import { WebSocketService, IWebSocketEventArgs } from '../../core/web-socket.service';
import { WebSocketMessageName } from '../../../../../shared/web-socket-message-name';
import { IWebSocketData } from '../../../../../shared/interfaces/web-socket/web-socket-data';
import { IGetDrivesRequest } from '../../../../../shared/interfaces/web-socket/get-drives-request';
import { IGetDrivesResponse } from '../../../../../shared/interfaces/web-socket/get-drives-response';
import { IClientDevice } from '../../../../../shared/interfaces/client-device';

@Component({
    templateUrl: './application-profiles.component.html'
})
export class ApplicationProfilesComponent implements OnInit, OnDestroy {

    private wsObs: Subject<IWebSocketEventArgs>;
    private subscription: Subscription;

    drives: string[] = [];
    devices: IClientDevice[] = [];
    selectedDevice: IClientDevice;
    selectedDrive: string;

    constructor(private dataSvc: DataService, private wsSvc: WebSocketService) {
        if (this.dataSvc) { }
    }

    ngOnInit(): void {
        this.wsObs = this.wsSvc.getSubject();
        this.subscription = this.wsObs.subscribe(value => {
            this.handleWebSocketMessage(value);
        });
        this.loadDevices();
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    loadDrives(deviceId: string): void {
        this.drives = [];
        this.wsSvc.send({
            name: WebSocketMessageName.getDrivesRequest,
            sender: null,
            data: <IGetDrivesRequest>{ deviceId: deviceId }
        });
    }

    async loadDevices(): Promise<void> {
        try {
            this.devices = await this.dataSvc.getClientDevices();
        } catch (err) {
        } finally {
        }
    }

    private handleWebSocketMessage(value: IWebSocketEventArgs): void {
        if (value.name === 'message') {
            try {
                const msgEvent = <MessageEvent>value.data;
                const msg = <IWebSocketData>JSON.parse(msgEvent.data);
                if (this.matchesMessage(msg, WebSocketMessageName.getDrivesResponse, this.selectedDevice)) {
                    const resp = <IGetDrivesResponse>msg.data;
                    this.drives = resp.drives;
                    this.selectedDrive = '';
                }
            } catch (err) { }
        }
    }

    private matchesMessage(msg: IWebSocketData, messageName: WebSocketMessageName, selectedDevice: IClientDevice): boolean {
        if (msg.name === messageName) {
            if (!msg.sender || (msg.sender && selectedDevice && msg.sender.deviceId === selectedDevice.id)) {
                // This data is for the selected device
                return true;
            }
        }
        return false;
    }
}
