import { IClientDeviceStatus } from '../../../../shared/interfaces/client-device-status';
import { IProcessInfo } from '../../../../shared/interfaces/web-socket/get-processes-response';

export class ClientDevicesStatusService {
    convertToClientDevicesStatusDisplay(
        clientDevicesStatus: IClientDeviceStatus[],
        currentClientDevicesStatusDisplay: IClentDeviceStatusDisplay[]): IClentDeviceStatusDisplay[] {
        const result: IClentDeviceStatusDisplay[] = [];
        // if (!currentClientDevicesStatusDisplay || !currentClientDevicesStatusDisplay.length) {
        // No existing display items - create new array
        for (let i = 0; i < clientDevicesStatus.length; i++) {
            const item = clientDevicesStatus[i];
            const existingStatusDisplay = this.getExistingStatusDisplay(item.deviceId, currentClientDevicesStatusDisplay);
            const convertedItem = <IClentDeviceStatusDisplay>Object.assign(existingStatusDisplay || {}, item);
            convertedItem.displayItems = existingStatusDisplay ?
                existingStatusDisplay.displayItems
                : <IClientDeviceStatusDisplayItems>{};
            convertedItem.displayItems = convertedItem.displayItems || <IClientDeviceStatusDisplayItems>{};
            convertedItem.displayItems.billText = '0.00';
            if (item.isStarted) {
                convertedItem.displayItems.billText = convertedItem.bill ? convertedItem.bill.toFixed(2) : '0.00';
            } else if (convertedItem.lastBill) {
                convertedItem.displayItems.billText = convertedItem.lastBill.toFixed(2);
            }
            // convertedItem.durationText = convertedItem.duration ? this.millisecondsToDisplayText(convertedItem.duration) : '';
            result.push(convertedItem);
        }
        // } else {
        //     // Need to merge existing items
        // }
        return result;
    }

    private getExistingStatusDisplay(
        deviceId: string,
        clientDevicesDisplay: IClentDeviceStatusDisplay[]
    ): IClentDeviceStatusDisplay | null {
        if (!clientDevicesDisplay) {
            return null;
        }
        const display = clientDevicesDisplay.find(x => x.deviceId === deviceId);
        return display || null;
    }

    // private getExistingStatusDisplayItems(
    //     clientDeviceStatusId: string,
    //     clientDevicesDisplay: IClentDeviceStatusDisplay[]
    // ): IClientDeviceStatusDisplayItems | null {
    //     if (!clientDevicesDisplay) {
    //         return null;
    //     }
    //     const displayDevice = clientDevicesDisplay.find(x => x.deviceId === clientDeviceStatusId);
    //     if (displayDevice) {
    //         return displayDevice.displayItems;
    //     }
    //     return null;
    // }

    // millisecondsToDisplayText(value: number): string {
    //     const millisecondsRoundedToNearestSecond = 1000 * Math.round(value / 1000);
    //     const totalSeconds = Math.floor(millisecondsRoundedToNearestSecond / 1000);
    //     const hours = Math.floor(totalSeconds / 3600);
    //     const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
    //     const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60);

    //     const minutesPrefix = (minutes < 10) ? '0' : '';
    //     const secondsPrefix = (seconds < 10) ? '0' : '';

    //     return `${hours}:${minutesPrefix}${minutes}:${secondsPrefix}${seconds}`;
    // }
}

export interface IClentDeviceStatusDisplay extends IClientDeviceStatus {
    displayItems: IClientDeviceStatusDisplayItems;
    // billText: string;
    // processes: IProcessInfo[];
    // utilsVisible: boolean;
    // durationText: string;
}

export interface IClientDeviceStatusDisplayItems {
    billText: string;
    processes: IProcessInfo[];
    utilTaskManagerVisible: boolean;
}
