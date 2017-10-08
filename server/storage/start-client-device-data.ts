import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';

export interface IStartClientDeviceData {
    args: IStartClientDeviceArgs;
    startedByClientId?: string;
    startedByEmployeeId?: string;
    startedAt: number;
    startedAtUptime: number;
}
