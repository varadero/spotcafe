import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../core/data.service';
import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';

@Component({
    templateUrl: './devices-groups.component.html'
})
export class DevicesGroupsComponent implements OnInit {
    devicesGroups: IDeviceGroup[];
    newDeviceGroup: IDeviceGroup;
    selectedDeviceGroup: IDeviceGroup;
    waiting = {
        loadingGroups: false,
        updatingGroup: false,
        creatingGroup: false
    };

    @ViewChild('updateDevicesGroupsMessagesComponent') private updateDevicesGroupsMessagesComponent: DisplayMessagesComponent;
    @ViewChild('createDevicesGroupsMessagesComponent') private createDevicesGroupsMessagesComponent: DisplayMessagesComponent;

    constructor(private dataSvc: DataService, private errorsSvc: ErrorsService) { }

    ngOnInit(): void {
        this.resetNewDeviceGroup();
        this.loadData();
    }

    async updateDeviceGroup(deviceGroup: IDeviceGroup): Promise<void> {
        try {
            this.waiting.updatingGroup = true;
            const result = await this.dataSvc.updateDeviceGroup(deviceGroup);
            if (result.alreadyExists) {
                this.updateDevicesGroupsMessagesComponent.addErrorMessage(`Group with the name '${deviceGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.updateDevicesGroupsMessagesComponent.addErrorMessage(`Price per hour '${deviceGroup.pricePerHour}' is invalid`);
            } else {
                this.updateDevicesGroupsMessagesComponent.addSuccessMessage(`Group '${deviceGroup.name}' was updated`);
            }
        } catch (err) {
            this.updateDevicesGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Update group'));
        } finally {
            this.waiting.updatingGroup = false;
        }
    }

    async createDeviceGroup(deviceGroup: IDeviceGroup): Promise<void> {
        try {
            this.waiting.creatingGroup = true;
            const result = await this.dataSvc.createDeviceGroup(deviceGroup);
            if (result.alreadyExists) {
                this.createDevicesGroupsMessagesComponent.addErrorMessage(`Group with the name '${deviceGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.createDevicesGroupsMessagesComponent.addErrorMessage(`Price per hour '${deviceGroup.pricePerHour}' is invalid`);
            } else {
                this.createDevicesGroupsMessagesComponent.addSuccessMessage(`Device group '${deviceGroup.name}' was created`);
                this.resetNewDeviceGroup();
                this.loadData();
            }
        } catch (err) {
            this.createDevicesGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Create group'));
        } finally {
            this.waiting.creatingGroup = false;
        }
    }

    private async loadData(): Promise<void> {
        try {
            this.devicesGroups = await this.dataSvc.getDevicesGroups();
        } catch (err) {

        } finally {

        }
    }

    private resetNewDeviceGroup(): void {
        this.newDeviceGroup = {
            description: '',
            id: '',
            name: '',
            pricePerHour: 0
        };
    }
}
