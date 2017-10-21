import { IStartedDeviceCalcBillData } from './started-device-calc-bill-data';

export interface IStartClientDeviceResult {
    alreadyStarted: boolean;
    startedDeviceCallBillData?: IStartedDeviceCalcBillData;
}
