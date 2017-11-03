import { Component, OnInit, ViewChild } from '@angular/core';

import { DataService } from '../../core/data.service';
import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';
import { IBaseEntity } from '../../../../../shared/interfaces/base-entity';

@Component({
    templateUrl: './devices-groups.component.html'
})
export class DevicesGroupsComponent implements OnInit {
    devicesGroups: IDeviceGroup[];
    newDeviceGroup: IDeviceGroup;
    selectedDeviceGroup: IDeviceGroup;
    applicationProfiles: IBaseEntity[];
    selectedApplicationProfileForNewGroup: IBaseEntity;
    selectedApplicationProfileForExistingGroup: IBaseEntity;
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

    canCreateNewDeviceGroup(): boolean {
        if (this.newDeviceGroup
            && this.newDeviceGroup.name
            && this.newDeviceGroup.name.trim()
            && this.selectedApplicationProfileForNewGroup
            && this.selectedApplicationProfileForNewGroup.id
            && !this.waiting.creatingGroup) {
            return true;
        }
        return false;
    }

    canUpdateDeviceGroup(): boolean {
        if (this.selectedDeviceGroup
            && this.selectedDeviceGroup.name
            && this.selectedDeviceGroup.name.trim()
            && this.selectedApplicationProfileForExistingGroup
            && this.selectedApplicationProfileForExistingGroup.id
            && !this.waiting.updatingGroup) {
            return true;
        }
        return false;
    }

    existingDeviceGroupSelected(deviceGroup: IDeviceGroup): void {
        if (!this.applicationProfiles) {
            return;
        }
        const appProfile = this.applicationProfiles.find(x => x.id === deviceGroup.applicationProfileId);
        if (appProfile) {
            this.selectedApplicationProfileForExistingGroup = appProfile;
        }
    }

    async updateDeviceGroup(deviceGroup: IDeviceGroup): Promise<void> {
        try {
            this.waiting.updatingGroup = true;
            deviceGroup.applicationProfileId = this.selectedApplicationProfileForExistingGroup.id;
            const result = await this.dataSvc.updateDeviceGroup(deviceGroup);
            if (result.alreadyExists) {
                this.updateDevicesGroupsMessagesComponent.addErrorMessage(`Group with the name '${deviceGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.updateDevicesGroupsMessagesComponent.addErrorMessage(`Price per hour '${deviceGroup.pricePerHour}' is invalid`);
            } else {
                this.updateDevicesGroupsMessagesComponent.addSuccessMessage(`Group '${deviceGroup.name}' was updated`);
            }
        } catch (err) {
            this.updateDevicesGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Update group error:'));
        } finally {
            this.waiting.updatingGroup = false;
        }
    }

    async createDeviceGroup(deviceGroup: IDeviceGroup): Promise<void> {
        try {
            this.waiting.creatingGroup = true;
            deviceGroup.applicationProfileId = this.selectedApplicationProfileForNewGroup.id;
            const result = await this.dataSvc.createDeviceGroup(deviceGroup);
            if (result.alreadyExists) {
                this.createDevicesGroupsMessagesComponent.addErrorMessage(`Group with the name '${deviceGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.createDevicesGroupsMessagesComponent.addErrorMessage(`Price per hour '${deviceGroup.pricePerHour}' is invalid`);
            } else {
                this.createDevicesGroupsMessagesComponent.addSuccessMessage(`Device group '${deviceGroup.name}' was created`);
                const selectedGroupId = this.selectedDeviceGroup ? this.selectedDeviceGroup.id : '';
                this.resetNewDeviceGroup();
                await this.loadData();
                this.setSelectedDeviceGroup(selectedGroupId);
            }
        } catch (err) {
            this.createDevicesGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Create group error:'));
        } finally {
            this.waiting.creatingGroup = false;
        }
    }

    private setSelectedDeviceGroup(deviceGroupId: string): void {
        if (!deviceGroupId) {
            return;
        }
        const selectedGroup = this.devicesGroups.find(x => x.id === deviceGroupId);
        if (selectedGroup) {
            this.selectedDeviceGroup = selectedGroup;
        }
    }
    private async loadData(): Promise<void> {
        try {
            this.devicesGroups = await this.dataSvc.getDevicesGroups();
            if (!this.applicationProfiles) {
                this.applicationProfiles = await this.dataSvc.getApplicationProfiles();
            }
        } catch (err) {

        } finally {

        }
    }

    private resetNewDeviceGroup(): void {
        this.newDeviceGroup = {
            description: '',
            id: '',
            name: '',
            pricePerHour: 0,
            applicationProfileId: ''
        };
    }
}
