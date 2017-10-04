import { Component, OnInit, ViewChild } from '@angular/core';

import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { DataService } from '../../core/data.service';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { IClientDeviceDisplay } from './client-device-display';
import { ClientDevicesService } from './client-devices.service';

@Component({
    templateUrl: './client-devices.component.html'
})
export class ClientDevicesComponent implements OnInit {
    clientDevices: IClientDeviceDisplay[];
    devicesGroups: IDeviceGroup[];

    waiting = {
        loadDevices: false,
        approveDevice: false,
        updateDevice: false
    };

    @ViewChild('loadDevicesMessagesComponent') private loadDevicesMessagesComponent: DisplayMessagesComponent;

    constructor(private dataSvc: DataService, private clientDevicesSvc: ClientDevicesService) { }

    ngOnInit(): void {
        this.loadData();
    }

    async updateDevice(clientDeviceDisplay: IClientDeviceDisplay): Promise<void> {
        try {
            this.waiting.updateDevice = true;
            clientDeviceDisplay.updating = true;
            const clientDevice = this.clientDevicesSvc.toClientDevice(clientDeviceDisplay);
            await this.dataSvc.updateClientDevice(clientDevice);
        } catch (err) {

        } finally {
            clientDeviceDisplay.updating = false;
            this.waiting.updateDevice = false;

        }
    }

    private async loadData(): Promise<void> {
        try {
            this.waiting.loadDevices = true;
            // const res = await Promise.all([this.dataSvc.getDevicesGroups(), this.dataSvc.getClientDevices()]);
            this.devicesGroups = await this.dataSvc.getDevicesGroups();
            const clientDevices = await this.dataSvc.getClientDevices();
            this.clientDevices = this.clientDevicesSvc.createClientDeviceDiplayItems(clientDevices, this.devicesGroups);
            this.sortClientDevices();
        } catch (err) {
            this.handleError(err, this.loadDevicesMessagesComponent, 'Loading devices');
        } finally {
            this.waiting.loadDevices = false;
        }
    }

    private sortClientDevices(): void {
        this.clientDevices.sort((left) => left.clientDevice.approved ? -1 : 1);
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        if (err.error && err.error.message) {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.error.message}`);
        } else {
            messagesComponent.addErrorMessage(`${messagePrefix} ${err.status} ${err.statusText}`);
        }
    }
}
