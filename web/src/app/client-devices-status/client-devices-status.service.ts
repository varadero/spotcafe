import { Injectable } from '@angular/core';
import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';

@Injectable()
export class ClientDevicesStatusService {
    convertToClientDevicesStatusDisplay(clientDevicesStatus: IClientDeviceStatus[]): IClentDeviceStatusDisplay[] {
        const result: IClentDeviceStatusDisplay[] = [];
        for (let i = 0; i < clientDevicesStatus.length; i++) {
            const item = clientDevicesStatus[i];
            const convertedItem = <IClentDeviceStatusDisplay>{ ...item };
            // TODO Convert milliseconds to text
            convertedItem.durationText = convertedItem.duration ? convertedItem.duration.toString() : '';
            result.push(convertedItem);

        }
        return result;
    }
}

export interface IClentDeviceStatusDisplay extends IClientDeviceStatus {
    durationText: string;
}
