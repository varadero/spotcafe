import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { IClientGroupWithDevicesGroupsIds } from '../../../../../shared/interfaces/client-group-with-devices-groups-ids';
import { IClientGroup } from '../../../../../shared/interfaces/client-group';

export class ClientsGroupsService {
    cloneDevicesGroups(devicesGroups: IDeviceGroup[]): IDeviceGroup[] {
        if (devicesGroups) {
            return [...devicesGroups];
        } else {
            return [];
        }
    }

    toClientsGroupsDisplay(
        clientsGroupsWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds[],
        devicesGroups: IDeviceGroup[]
    ): IClientGroupDisplay[] {
        const result: IClientGroupDisplay[] = [];
        for (let i = 0; i < clientsGroupsWithDevicesGroupsIds.length; i++) {
            const item = clientsGroupsWithDevicesGroupsIds[i];
            const obj = <IClientGroupDisplay>{
                clientGroup: clientsGroupsWithDevicesGroupsIds[i].clientGroup,
                devicesGroups: []
            };
            if (devicesGroups) {
                for (let j = 0; j < item.devicesGroupsIds.length; j++) {
                    const deviceGroup = devicesGroups.find(x => x.id === item.devicesGroupsIds[j]);
                    if (deviceGroup) {
                        obj.devicesGroups.push(deviceGroup);
                    }
                }
            }
            result.push(obj);
        }
        return result;
    }

    toClientGroupWithDevicesGroupsIds(clientGroupDisplay: IClientGroupDisplay): IClientGroupWithDevicesGroupsIds {
        const result = <IClientGroupWithDevicesGroupsIds>{
            clientGroup: clientGroupDisplay.clientGroup,
            devicesGroupsIds: clientGroupDisplay.devicesGroups.map(x => x.id)
        };
        return result;
    }

    addDeiceGroupToClientGroup(clientGroup: IClientGroupDisplay, deviceGroup: IDeviceGroup): boolean {
        const existingDeviceGroup = clientGroup.devicesGroups.find(x => x.id === deviceGroup.id);
        if (existingDeviceGroup) {
            return false;
        }
        clientGroup.devicesGroups.push(deviceGroup);
        return true;
    }

    removeDeviceGroupFromClientGroup(clientGroup: IClientGroupDisplay, deviceGroup: IDeviceGroup): boolean {
        const index = clientGroup.devicesGroups.findIndex(x => x.id === deviceGroup.id);
        if (index === -1) {
            return false;
        }
        clientGroup.devicesGroups.splice(index, 1);
        return true;
    }
}

export interface IClientGroupDisplay {
    clientGroup: IClientGroup;
    devicesGroups: IDeviceGroup[];
}
