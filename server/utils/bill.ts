import { Time } from './time';

export class Bill {
    private time = new Time();

    calcBill(calcBillData: IClientDeviceCalcBillData): ICalcBillResult {
        const result: ICalcBillResult = {
            timeUsed: 0,
            totalBill: 0
        };
        if (!calcBillData.startedAt || !calcBillData.startedAtUptime) {
            return result;
        }
        const maxTimeDiff = this.getMaxDiff(
            calcBillData.startedAt,
            calcBillData.startedAtUptime,
            this.time.getCurrentTime(),
            this.time.getCurrentUptime()
        );
        if (maxTimeDiff < 0) {
            // TODO Something strange happened
            // Maybe server was restarted and the time was changed to a value before the device was started
        }
        // The diff is in milliseconds - convert to hours
        const diffSeconds = maxTimeDiff / 1000;
        const diffHours = diffSeconds / 3600;
        const totalBill = Math.round(diffHours * calcBillData.pricePerHour * 100) / 100;

        result.timeUsed = maxTimeDiff;
        result.totalBill = totalBill;
        return result;
    }

    getMaxDiff(
        startedAt: number,
        startedAtUptime: number,
        stoppedAt: number,
        stoppedAtUptime: number
    ): number {
        const uptimeDiff = stoppedAtUptime - startedAtUptime;
        const timeDiff = stoppedAt - startedAt;
        const maxTimeDiff = Math.max(uptimeDiff, timeDiff);
        return maxTimeDiff;
    }
}

export interface ICalcBillResult {
    totalBill: number;
    timeUsed: number;
}

export interface IClientDeviceCalcBillData {
    startedAt?: number;
    startedAtUptime?: number;
    pricePerHour: number;
}
