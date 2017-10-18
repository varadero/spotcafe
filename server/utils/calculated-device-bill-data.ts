import { IStartedDeviceCalcBillData } from '../storage/started-device-calc-bill-data';
import { ICalcBillResult } from './calc-engine';

export interface ICalculatedDeviceBillData {
    calcBillData: IStartedDeviceCalcBillData;
    calcBillResult: ICalcBillResult;
}
