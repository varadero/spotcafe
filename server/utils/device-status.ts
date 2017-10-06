import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';
import { Bill } from './bill';

export class DeviceStatus {
    private bill = new Bill();

    setDevicesStatusBill(status: IClientDeviceStatus[]): void {
        for (const item of status) {
            if (item.isStarted) {
                const bill = this.bill.calcBill({
                    pricePerHour: item.pricePerHour,
                    startedAt: item.startedAt,
                    startedAtUptime: item.startedAtUptime
                });
                item.duration = bill.timeUsed;
                item.bill = bill.totalBill;
            } else {
                if (item.startedAt && item.startedAtUptime && item.stoppedAt && item.stoppedAtUptime) {
                    item.duration = this.bill.getMaxDiff(
                        item.startedAt,
                        item.startedAtUptime,
                        item.stoppedAt,
                        item.stoppedAtUptime
                    );
                }
            }
        }
    }
}
