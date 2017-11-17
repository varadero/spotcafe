import { IToken } from '../../../shared/interfaces/token';
import { IClientDeviceSettings } from './client-device-settings';

export interface ILoginClientDeviceResponse {
    deviceToken: IToken;
    clientDeviceSettings: IClientDeviceSettings;
}
