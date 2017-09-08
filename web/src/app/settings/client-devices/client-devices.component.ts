import { Component, OnInit, ViewChild } from '@angular/core';

import { IClientDevice } from '../../../../../shared/interfaces/client-device';
import { DataService } from '../../core/data.sevice';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';

@Component({
    templateUrl: './client-devices.component.html'
})
export class ClientDevicesComponent implements OnInit {
    approvedDevices: IClientDevice[];
    notApprovedDevices: IClientDevice[];

    waiting = {
        loadDevices: false,
        approveDevice: false,
        updateDevice: false
    };

    @ViewChild('loadDevicesMessagesComponent') private loadDevicesMessagesComponent: DisplayMessagesComponent;

    constructor(private dataSvc: DataService) { }

    ngOnInit(): void {
        this.loadData();
    }

    async updateDevice(device: IClientDevice): Promise<void> {
        try {
            this.waiting.updateDevice = true;
            await this.dataSvc.updateClientDevice(device);
            this.loadData();
        } catch (err) {

        } finally {
            this.waiting.updateDevice = false;

        }
    }

    async approveDevice(device: IClientDevice): Promise<void> {
        try {
            this.waiting.approveDevice = true;
            await this.dataSvc.approveClientDevice(device);
            this.loadData();
        } catch (err) {

        } finally {
            this.waiting.approveDevice = false;
        }
    }

    private async loadData(): Promise<void> {
        try {
            this.waiting.loadDevices = true;
            const res = await this.dataSvc.getClientDevices();
            this.approvedDevices = res.filter(x => x.approved);
            this.notApprovedDevices = res.filter(x => !x.approved);
        } catch (err) {
            this.handleError(err, this.loadDevicesMessagesComponent, 'Loading devices and roles');
        } finally {
            this.waiting.loadDevices = false;
        }
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        if (err.error && err.error.message) {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.error.message}`);
        } else {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.status} ${err.statusText}`);
        }
    }
}
