import { IClientDeviceAlreadyStartedInfo } from './client-device-already-started-info';

export interface IStartClientDeviceResult {
    alreadyStartedInfo: IClientDeviceAlreadyStartedInfo;
    notEnoughCredit: boolean;
}
