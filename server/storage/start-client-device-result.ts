import { IStartedDeviceCalcBillData } from './started-device-calc-bill-data';
import { IClientDeviceAlreadyStartedInfo } from '../../shared/interfaces/client-device-already-started-info';

export interface IStartClientDeviceResult {
    clientDeviceAlreadyStartedInfo: IClientDeviceAlreadyStartedInfo;
    startedDeviceCallBillData?: IStartedDeviceCalcBillData;
}
