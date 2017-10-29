import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { DataService } from '../../core/data.service';
import { WebSocketService, IWebSocketEventArgs } from '../../core/web-socket.service';
import { WebSocketMessageName } from '../../../../../shared/web-socket-message-name';
import { IWebSocketData } from '../../../../../shared/interfaces/web-socket/web-socket-data';
import { IGetDrivesRequest } from '../../../../../shared/interfaces/web-socket/get-drives-request';
import { IGetDrivesResponse } from '../../../../../shared/interfaces/web-socket/get-drives-response';

@Component({
    templateUrl: './application-profiles.component.html'
})
export class ApplicationProfilesComponent implements OnInit, OnDestroy {

    private wsObs: Subject<IWebSocketEventArgs>;
    drives: string[] = [];

    constructor(private dataSvc: DataService, private wsSvc: WebSocketService) {
        if (this.dataSvc) { }
    }

    ngOnInit(): void {
        this.wsObs = this.wsSvc.getSubject();
        this.wsObs.subscribe(value => {
            this.handleWebSocketMessage(value);
        });
    }

    ngOnDestroy(): void {
        this.wsObs.unsubscribe();
    }

    loadDrives(): void {
        this.wsSvc.send({
            name: WebSocketMessageName.getDrivesRequest,
            data: <IGetDrivesRequest>{ deviceId: '145b0408-ab46-4f6f-9912-b95862026df5' }
        });
    }

    private handleWebSocketMessage(value: IWebSocketEventArgs): void {
        if (value.name === 'message') {
            try {
                const msgEvent = <MessageEvent>value.data;
                const msg = <IWebSocketData>JSON.parse(msgEvent.data);
                if (msg.name === WebSocketMessageName.getDrivesResponse) {
                    const resp = <IGetDrivesResponse>msg.data;
                    this.drives = resp.drives;
                }
            } catch (err) { }
        }
    }
}
