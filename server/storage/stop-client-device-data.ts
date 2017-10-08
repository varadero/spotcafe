import { IStopClientDeviceArgs } from '../../shared/interfaces/stop-client-device-args';

export interface IStopClientDeviceData {
    args: IStopClientDeviceArgs;
    stoppedByEmployeeId?: string;
    stoppedAt: number;
    stoppedAtUptime: number;
    lastBill: number;
}
