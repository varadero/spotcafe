import { IClientDevice } from '../../../../../shared/interfaces/client-device';
import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';
import { IClientDeviceDisplay } from './client-device-display';

export class ClientDevicesService {
    createClientDeviceDiplayItems(clientDevices: IClientDevice[], devicesGroups: IDeviceGroup[]): IClientDeviceDisplay[] {
        const result: IClientDeviceDisplay[] = [];
        for (let i = 0; i < clientDevices.length; i++) {
            const clientDevice = clientDevices[i];
            const resultItem = <IClientDeviceDisplay>{
                clientDevice: Object.assign({}, clientDevice),
                groups: [...devicesGroups]
            };
            resultItem.selectedGroup = <IDeviceGroup>resultItem.groups.find(x => x.id === resultItem.clientDevice.deviceGroup.id);
            result.push(resultItem);
        }
        return result;
    }

    toClientDevice(clientDeviceDisplay: IClientDeviceDisplay): IClientDevice {
        const clientDevice = clientDeviceDisplay.clientDevice;
        clientDevice.deviceGroup = <IClientDevice>{ id: clientDeviceDisplay.selectedGroup.id };
        return clientDevice;
    }
}

