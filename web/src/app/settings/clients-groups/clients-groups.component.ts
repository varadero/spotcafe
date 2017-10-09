import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../core/data.service';
import { IClientGroup } from '../../../../../shared/interfaces/client-group';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';

@Component({
    templateUrl: './clients-groups.component.html'
})
export class ClientsGroupsComponent implements OnInit {
    clientsGroups: IClientGroup[];
    newClientGroup: IClientGroup;
    selectedClientGroup: IClientGroup;
    waiting = {
        loadingGroups: false,
        updatingGroup: false,
        creatingGroup: false
    };

    @ViewChild('updateClientsGroupsMessagesComponent') private updateClientsGroupsMessagesComponent: DisplayMessagesComponent;
    @ViewChild('createClientsGroupsMessagesComponent') private createClientsGroupsMessagesComponent: DisplayMessagesComponent;

    constructor(private dataSvc: DataService, private errorsSvc: ErrorsService) { }

    ngOnInit(): void {
        this.resetNewClientGroup();
        this.loadData();
    }

    async updateClientGroup(clientGroup: IClientGroup): Promise<void> {
        try {
            this.waiting.updatingGroup = true;
            const result = await this.dataSvc.updateClientGroup(clientGroup);
            if (result.alreadyExists) {
                this.updateClientsGroupsMessagesComponent.addErrorMessage(`Group with the name '${clientGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.updateClientsGroupsMessagesComponent.addErrorMessage(`Price per hour '${clientGroup.pricePerHour}' is invalid`);
            } else {
                this.updateClientsGroupsMessagesComponent.addSuccessMessage(`Group '${clientGroup.name}' was updated`);
            }
        } catch (err) {
            this.updateClientsGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Update group'));
        } finally {
            this.waiting.updatingGroup = false;
        }
    }

    async createClientGroup(deviceGroup: IClientGroup): Promise<void> {
        try {
            this.waiting.creatingGroup = true;
            const result = await this.dataSvc.createClientGroup(deviceGroup);
            if (result.alreadyExists) {
                this.createClientsGroupsMessagesComponent.addErrorMessage(`Group with the name '${deviceGroup.name}' already exist`);
            } else if (result.invalidPricePerHour) {
                this.createClientsGroupsMessagesComponent.addErrorMessage(`Price per hour '${deviceGroup.pricePerHour}' is invalid`);
            } else {
                this.createClientsGroupsMessagesComponent.addSuccessMessage(`Client group '${deviceGroup.name}' was created`);
                this.resetNewClientGroup();
                this.loadData();
            }
        } catch (err) {
            this.createClientsGroupsMessagesComponent.addErrorMessage(this.errorsSvc.getNetworkErrorMessage(err, 'Create group'));
        } finally {
            this.waiting.creatingGroup = false;
        }
    }

    private async loadData(): Promise<void> {
        try {
            this.clientsGroups = await this.dataSvc.getClientsGroups();
        } catch (err) {

        } finally {

        }
    }

    private resetNewClientGroup(): void {
        this.newClientGroup = {
            description: '',
            id: '',
            name: '',
            pricePerHour: 0
        };
    }
}
