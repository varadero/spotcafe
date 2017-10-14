import { IClientDisplay } from './client-display';
import { IClient } from '../../../../../shared/interfaces/client';
import { IClientGroupWithDevicesGroupsIds } from '../../../../../shared/interfaces/client-group-with-devices-groups-ids';

export class ClientsService {
    createClientDiplayItems(clients: IClient[], clientsGroups: IClientGroupWithDevicesGroupsIds[]): IClientDisplay[] {
        const result: IClientDisplay[] = [];
        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            const resultItem = <IClientDisplay>{
                client: Object.assign({}, client),
                groups: [...clientsGroups]
            };
            resultItem.selectedGroup = <IClientGroupWithDevicesGroupsIds>resultItem.groups
                .find(x => x.clientGroup.id === resultItem.client.clientGroupId);
            result.push(resultItem);
        }
        return result;
    }

    cloneClientsGroups(clientsGroups: IClientGroupWithDevicesGroupsIds[]): IClientGroupWithDevicesGroupsIds[] {
        return clientsGroups.map(x => Object.assign({}, x));
    }

    toClient(clientDisplay: IClientDisplay): IClient {
        const client = <IClient>{
            clientGroupId: clientDisplay.selectedGroup.clientGroup.id,
            disabled: clientDisplay.client.disabled,
            email: clientDisplay.client.email,
            firstName: clientDisplay.client.firstName,
            id: clientDisplay.client.id,
            lastName: clientDisplay.client.lastName,
            password: clientDisplay.client.password,
            phone: clientDisplay.client.phone,
            username: clientDisplay.client.username
        };
        return client;
    }

    getNewClientErrors(clientDisplay: IClientDisplay): INewClientErrors {
        const result = <INewClientErrors>{};
        if (!clientDisplay.client.username) {
            result.usernameNotSupplied = true;
        }
        if (!clientDisplay.client.password
            || !clientDisplay.client.password.trim()
            || clientDisplay.client.password !== clientDisplay.confirmPassword) {
            result.passwordsDontMatch = true;
        }
        if (clientDisplay.client.password && clientDisplay.client.password.length < 6) {
            result.passwordTooShort = true;
        }
        result.hasErrors = result.passwordsDontMatch || result.passwordTooShort || result.usernameNotSupplied;
        return result;
    }
}

export interface INewClientErrors {
    hasErrors: boolean;
    usernameNotSupplied: boolean;
    passwordsDontMatch: boolean;
    passwordTooShort: boolean;
}
