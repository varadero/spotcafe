import { IClientDevice } from '../../shared/interfaces/client-device';

export interface IRegisterClientDeviceResult {
    clientDevice: IClientDevice;
    createdNew: boolean;
}
