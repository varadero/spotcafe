import { Component, OnInit, ViewChild } from '@angular/core';

import { IClientDisplay } from './client-display';
import { DataService } from '../../core/data.service';
import { ClientsService } from './clients.service';
import { IClientGroupWithDevicesGroupsIds } from '../../../../../shared/interfaces/client-group-with-devices-groups-ids';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';
import { ErrorsService } from '../../shared/errors.service';
import { Numbers } from '../../../../../shared/numbers';

@Component({
    templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit {
    clients: IClientDisplay[];
    selectedClient: IClientDisplay;
    newClient: IClientDisplay;
    waiting = {
        updatingClient: false,
        creatingClient: false
    };
    addCreditAmount = 0;

    @ViewChild('newClientMessagesComponent') private newClientMessagesComponent: DisplayMessagesComponent;
    @ViewChild('updateClientMessagesComponent') private updateClientMessagesComponent: DisplayMessagesComponent;

    private clientsGroups: IClientGroupWithDevicesGroupsIds[] = [];
    private numbers = new Numbers();

    constructor(
        private dataSvc: DataService,
        private clientsSvc: ClientsService,
        private errorsSvc: ErrorsService) { }

    ngOnInit(): void {
        this.resetNewClient();
        this.loadData();
    }

    addCreditChanged(stringValue: string): void {
        this.addCreditAmount = this.numbers.stringToNumber(stringValue);
    }

    async addClientCredit(): Promise<void> {
        if (isNaN(this.addCreditAmount)) {
            const errorMessage = 'Specified credit to add is not a number';
            this.updateClientMessagesComponent.addErrorMessage(errorMessage);
            return;
        }

        try {
            this.waiting.updatingClient = true;
            const newCredit = await this.dataSvc.addClientCredit(this.selectedClient.client.id, this.addCreditAmount);
            const clientUsername = this.selectedClient.client.username;
            this.updateClientMessagesComponent.addSuccessMessage(`Client '${clientUsername}' credit is now ${newCredit}`);
            this.loadData();
        } catch (err) {
            this.handleError(err, this.updateClientMessagesComponent, 'Add credit error:');
        } finally {
            this.waiting.updatingClient = false;
        }
    }

    async updateClient(selectedClient: IClientDisplay): Promise<void> {
        selectedClient.client.username = selectedClient.client.username.trim();
        if (!selectedClient.client.username) {
            this.updateClientMessagesComponent.addErrorMessage('Username not supplied');
            return;
        }
        try {
            this.waiting.updatingClient = true;
            const client = this.clientsSvc.toClient(selectedClient);
            const updateResult = await this.dataSvc.updateClient(client);
            if (updateResult.alreadyExists) {
                this.updateClientMessagesComponent.addErrorMessage(`Client with username '${client.username}' already exist`);
            } else {
                this.updateClientMessagesComponent.addSuccessMessage(`Client '${client.username}' has been updated`);
            }
        } catch (err) {
            this.handleError(err, this.updateClientMessagesComponent, 'Update client error:');
        } finally {
            this.waiting.updatingClient = false;
        }
    }

    async createClient(newClient: IClientDisplay): Promise<void> {
        try {
            const newClientErrors = this.clientsSvc.getNewClientErrors(newClient);
            if (newClientErrors.hasErrors) {
                if (newClientErrors.usernameNotSupplied) {
                    this.newClientMessagesComponent.addErrorMessage('Username not supplied');
                } else if (newClientErrors.passwordsDontMatch) {
                    this.newClientMessagesComponent.addErrorMessage(`Passwords don't match`);
                } else if (newClientErrors.passwordTooShort) {
                    this.newClientMessagesComponent.addErrorMessage('Password too short');
                }
                return;
            }
            const client = this.clientsSvc.toClient(newClient);
            this.waiting.creatingClient = true;
            const createResult = await this.dataSvc.createClient(client);
            if (createResult.alreadyExists) {
                this.newClientMessagesComponent.addErrorMessage(`Client with username '${client.username}' already exist`);
            } else {
                this.newClientMessagesComponent.addSuccessMessage(`Client '${client.username}' was created`);
                this.resetNewClient();
                this.loadData();
            }
        } catch (err) {
            this.handleError(err, this.newClientMessagesComponent, 'Create client error:');
        } finally {
            this.waiting.creatingClient = false;
        }
    }

    private async loadData(): Promise<void> {
        try {
            let selectedClientId = '';
            if (this.selectedClient) {
                selectedClientId = this.selectedClient.client.id;
            }
            const clientsResult = await this.dataSvc.getClients();
            this.clientsGroups = await this.dataSvc.getClientsGroups();
            this.clients = this.clientsSvc.createClientDiplayItems(clientsResult, this.clientsGroups);
            this.resetNewClient();
            if (selectedClientId) {
                const selectedClient = this.clients.find(x => x.client.id === selectedClientId);
                if (selectedClient) {
                    this.selectedClient = selectedClient;
                }
            }
        } catch (err) {
        } finally {
        }
    }

    private resetNewClient(): void {
        this.newClient = <IClientDisplay>{
            client: {
                clientGroupId: '',
                disabled: false,
                email: '',
                firstName: '',
                id: '',
                lastName: '',
                password: '',
                phone: '',
                username: '',
                credit: 0
            },
            groups: this.clientsSvc.cloneClientsGroups(this.clientsGroups)
        };
        if (this.newClient.groups.length > 0) {
            this.newClient.selectedGroup = this.newClient.groups[0];
        } else {
            this.newClient.selectedGroup = {
                clientGroup: {
                    description: '',
                    id: '',
                    name: '',
                    pricePerHour: 0,
                },
                devicesGroupsIds: []
            };
        }
    }

    private handleError(err: any, messagesComponent: DisplayMessagesComponent, messagePrefix: string): void {
        const errMessage = this.errorsSvc.getNetworkErrorMessage(err, messagePrefix);
        messagesComponent.addErrorMessage(errMessage);
    }
}
