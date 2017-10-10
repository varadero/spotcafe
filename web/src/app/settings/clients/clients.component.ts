import { Component, OnInit, ViewChild } from '@angular/core';
import { IClientDisplay } from './client-display';
import { DataService } from '../../core/data.service';
import { ClientsService } from './clients.service';
import { IClientGroup } from '../../../../../shared/interfaces/client-group';
import { DisplayMessagesComponent } from '../../shared/display-messages.component';

@Component({
    templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit {
    clients: IClientDisplay[];
    selectedClient: IClientDisplay;
    newClient: IClientDisplay;

    @ViewChild('newClientMessagesComponent') private newClientMessagesComponent: DisplayMessagesComponent;

    private clientsGroups: IClientGroup[] = [];

    constructor(private dataSvc: DataService, private clientsSvc: ClientsService) { }

    ngOnInit(): void {
        this.resetNewClient();
        this.loadData();
    }

    async createClient(newClient: IClientDisplay): Promise<void> {
        try {
            const newClientErrors = this.clientsSvc.getNewClientErrors(newClient);
            if (newClientErrors.hasErrors) {
                if (newClientErrors.usernameNotSupplied) {
                    this.newClientMessagesComponent.addErrorMessage(`Username not supplied`);
                } else if (newClientErrors.passwordsDontMatch) {
                    this.newClientMessagesComponent.addErrorMessage(`Passwords don't match`);
                } else if (newClientErrors.passwordTooShort) {
                    this.newClientMessagesComponent.addErrorMessage(`Password too short`);
                }
                return;
            }
            const client = this.clientsSvc.toClient(newClient);
            const createResult = await this.dataSvc.createClient(client);
            if (createResult.alreadyExists) {
                this.newClientMessagesComponent.addErrorMessage(`Client with username '${client.username}' already exist`);
            } else {
                this.newClientMessagesComponent.addSuccessMessage(`Client '${client.username}' was created`);
                this.resetNewClient();
                this.loadData();
            }
        } catch (err) {

        } finally {

        }
    }

    private async loadData(): Promise<void> {
        try {
            const clientsResult = await this.dataSvc.getClients();
            this.clientsGroups = await this.dataSvc.getClientsGroups();
            this.clients = this.clientsSvc.createClientDiplayItems(clientsResult, this.clientsGroups);
            this.resetNewClient();
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
                username: ''
            },
            groups: this.clientsSvc.cloneClientsGroups(this.clientsGroups)
        };
        if (this.newClient.groups.length > 0) {
            this.newClient.selectedGroup = this.newClient.groups[0];
        } else {
            this.newClient.selectedGroup = {
                description: '',
                id: '',
                name: '',
                pricePerHour: 0
            };
        }
    }
}
