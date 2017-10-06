import { IStopClientDeviceArgs } from '../../shared/interfaces/stop-client-device-args';

export interface IStopClientDeviceData {
    args: IStopClientDeviceArgs;
    stoppedAt: number;
    stoppedAtUptime: number;
    lastBill: number;
}
