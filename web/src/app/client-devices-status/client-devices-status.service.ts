import { Injectable } from '@angular/core';
import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';

@Injectable()
export class ClientDevicesStatusService {
    convertToClientDevicesStatusDisplay(clientDevicesStatus: IClientDeviceStatus[]): IClentDeviceStatusDisplay[] {
        const result: IClentDeviceStatusDisplay[] = [];
        for (let i = 0; i < clientDevicesStatus.length; i++) {
            const item = clientDevicesStatus[i];
            const convertedItem = <IClentDeviceStatusDisplay>Object.assign({}, item);
            if (item.isStarted) {
                convertedItem.billText = convertedItem.bill ? convertedItem.bill.toFixed(2) : '0.00';
            } else if (convertedItem.lastBill) {
                convertedItem.billText = convertedItem.lastBill.toFixed(2);
            }
            convertedItem.durationText = convertedItem.duration ? this.millisecondsToDisplayText(convertedItem.duration) : '';
            result.push(convertedItem);
        }
        return result;
    }

    millisecondsToDisplayText(value: number): string {
        const millisecondsRoundedToNearestSecond = 1000 * Math.round(value / 1000);
        const totalSeconds = Math.floor(millisecondsRoundedToNearestSecond / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
        const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60);

        const minutesPrefix = (minutes < 10) ? '0' : '';
        const secondsPrefix = (seconds < 10) ? '0' : '';

        return `${hours}:${minutesPrefix}${minutes}:${secondsPrefix}${seconds}`;
    }
}

export interface IClentDeviceStatusDisplay extends IClientDeviceStatus {
    billText: string;
    durationText: string;
}
