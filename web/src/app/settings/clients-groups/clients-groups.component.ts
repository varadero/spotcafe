import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../core/data.service';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';
import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { ClientsGroupsService, IClientGroupDisplay } from './clients-groups.service';

@Component({
    templateUrl: './clients-groups.component.html'
})
export class ClientsGroupsComponent implements OnInit {
    clientsGroups: IClientGroupDisplay[];
    newClientGroupWithDevicesGroups: IClientGroupDisplay;
    selectedClientGroup: IClientGroupDisplay;
    devicesGroups: IDeviceGroup[];
    devicesGroupsForExistingClientGroup: IDeviceGroup[];
    selectedDeviceGroupForExistingClientGroup: IDeviceGroup;
    devicesGroupsForNewClientGroup: IDeviceGroup[];
    selectedDeviceGroupForNewClientGroup: IDeviceGroup;
    waiting = {
        loadingGroups: false,
        updatingGroup: false,
        creatingGroup: false
    };

    @ViewChild('updateClientsGroupsMessagesComponent') private updateClientsGroupsMessagesComponent: DisplayMessagesComponent;
    @ViewChild('createClientsGroupsMessagesComponent') private createClientsGroupsMessagesComponent: DisplayMessagesComponent;

    constructor(
        private dataSvc: DataService,
        private errorsSvc: ErrorsService,
        private clientsGroupsSvc: ClientsGroupsService
    ) { }

    ngOnInit(): void {
        this.resetNewClientGroup();
        this.loadData();
    }

    addDeviceGroupToNewClientGroup(deviceGroup: IDeviceGroup): void {
        this.clientsGroupsSvc.addDeiceGroupToClientGroup(this.newClientGroupWithDevicesGroups, deviceGroup);
    }
    removeDeviceGroupFromNewClientGroup(deviceGroup: IDeviceGroup): void {
        this.clientsGroupsSvc.removeDeviceGroupFromClientGroup(this.newClientGroupWithDevicesGroups, deviceGroup);
    }

    addDeviceGroupToSelectedExistingClientGroup(deviceGroup: IDeviceGroup): void {
        this.clientsGroupsSvc.addDeiceGroupToClientGroup(this.selectedClientGroup, deviceGroup);
    }

    removeSelectedClientGroupDeviceGroup(deviceGroup: IDeviceGroup): void {
        this.clientsGroupsSvc.removeDeviceGroupFromClientGroup(this.selectedClientGroup, deviceGroup);
    }

    async updateClientGroup(clientGroupDisplay: IClientGroupDisplay): Promise<void> {
        try {
            const clientGroup = clientGroupDisplay.clientGroup;
            this.waiting.updatingGroup = true;
            const clientGroupWithDevicesGroupsIds = this.clientsGroupsSvc.toClientGroupWithDevicesGroupsIds(clientGroupDisplay);
            const result = await this.dataSvc.updateClientGroup(clientGroupWithDevicesGroupsIds);
            if (result.alreadyExists) {
                this.updateClientsGroupsMessagesComponent.addErrorMessage(`Group with the name '${clientGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.updateClientsGroupsMessagesComponent.addErrorMessage(`Price per hour '${clientGroup.pricePerHour}' is invalid`);
            } else {
                this.updateClientsGroupsMessagesComponent.addSuccessMessage(`Group '${clientGroup.name}' was updated`);
                this.loadData();
            }
        } catch (err) {
            this.handleError(err, this.updateClientsGroupsMessagesComponent, 'Update group');
        } finally {
            this.waiting.updatingGroup = false;
        }
    }

    async createClientGroup(clientGroupDisplay: IClientGroupDisplay): Promise<void> {
        try {
            const clientGroup = clientGroupDisplay.clientGroup;
            this.waiting.creatingGroup = true;
            const clientGroupWithDevicesGroupsIds = this.clientsGroupsSvc.toClientGroupWithDevicesGroupsIds(clientGroupDisplay);
            const result = await this.dataSvc.createClientGroup(clientGroupWithDevicesGroupsIds);
            if (result.alreadyExists) {
                this.createClientsGroupsMessagesComponent
                    .addErrorMessage(`Group with the name '${clientGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.createClientsGroupsMessagesComponent
                    .addErrorMessage(`Price per hour '${clientGroup.pricePerHour}' is invalid`);
            } else {
                this.createClientsGroupsMessagesComponent
                    .addSuccessMessage(`Client group '${clientGroup.name}' was created`);
                this.resetNewClientGroup();
                this.loadData();
            }
        } catch (err) {
            this.handleError(err, this.createClientsGroupsMessagesComponent, 'Create group');
        } finally {
            this.waiting.creatingGroup = false;
        }
    }

    private async loadData(): Promise<void> {
        try {
            const selectedClientGroupId = this.selectedClientGroup ? this.selectedClientGroup.clientGroup.id : null;
            const clientsGroupsWithDevicesGroupsIds = await this.dataSvc.getClientsGroups();
            this.devicesGroups = await this.dataSvc.getDevicesGroups();
            this.devicesGroupsForExistingClientGroup = this.clientsGroupsSvc.cloneDevicesGroups(this.devicesGroups);
            this.devicesGroupsForNewClientGroup = this.clientsGroupsSvc.cloneDevicesGroups(this.devicesGroups);
            this.clientsGroups = this.clientsGroupsSvc.toClientsGroupsDisplay(clientsGroupsWithDevicesGroupsIds, this.devicesGroups);
            this.selectedClientGroup = <IClientGroupDisplay>this.clientsGroups.find(x => x.clientGroup.id === selectedClientGroupId);
        } catch (err) {

        } finally {

        }
    }

    private resetNewClientGroup(): void {
        this.newClientGroupWithDevicesGroups = {
            clientGroup: {
                description: '',
                id: '',
                name: '',
                pricePerHour: 0
            },
            devicesGroups: []
        };
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }
}
