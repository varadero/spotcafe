import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';

export interface IStartClientDeviceData {
    args: IStartClientDeviceArgs;
    startedAt: number;
    startedAtUptime: number;
}
