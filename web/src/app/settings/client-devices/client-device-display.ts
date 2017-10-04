import { IClientDevice } from '../../../../../shared/interfaces/client-device';
import { IDeviceGroup } from '../../../../../shared/interfaces/device-group';


export interface IClientDeviceDisplay {
    clientDevice: IClientDevice;
    groups: IDeviceGroup[];
    selectedGroup: IDeviceGroup;
    updating: boolean;
}
