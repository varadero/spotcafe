import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { ITotalsByClientDeviceAndEmployee } from '../../shared/interfaces/totals-by-client-device-and-employee';
import { IDateAndTime } from '../../shared/interfaces/date-and-time';
import { IFromToDateAndTime } from '../../shared/interfaces/from-to-date-and-time';
import { IRouteActionResult } from './interfaces/route-action-result';

export class ReportsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getTotalsByClientDeviceAndEmployee(): any {
        return route.get(this.apiPrefix + 'reports/totals-by-client-device-and-employee', async ctx => {
            const from = this.getFromDateAndTime(ctx.query);
            const to = this.getToDateAndTime(ctx.query);
            await this.handleActionResult(ctx, () => this.getTotalsByClientDeviceAndEmployeeImpl(from, to));
        });
    }

    private async getTotalsByClientDeviceAndEmployeeImpl(
        from: IDateAndTime,
        to: IDateAndTime
    ): Promise<IRouteActionResult<ITotalsByClientDeviceAndEmployee> | void> {
        const startedAt = this.toTimestamp(from);
        const stoppedAt = this.toTimestamp(to);
        // TODO Create combined function at storage provider
        const byClient = await this.storageProvider.getTotalsByClientReport(startedAt, stoppedAt);
        const byDevice = await this.storageProvider.getTotalsByDeviceReport(startedAt, stoppedAt);
        const byEmployee = await this.storageProvider.getTotalsByEmployeeReport(startedAt, stoppedAt);
        const resultValue = <ITotalsByClientDeviceAndEmployee>{
            clients: byClient,
            devices: byDevice,
            employees: byEmployee
        };
        return { value: resultValue };
    }

    private toTimestamp(value: IDateAndTime): number {
        const hour = Math.round(value.minute / 60);
        const minute = value.minute % 60;
        const result = new Date(value.year, value.month - 1, value.day, hour, minute, 0);
        return result.getTime();
    }

    private getFromDateAndTime(fromToDateAndTime: IFromToDateAndTime): IDateAndTime {
        const result = <IDateAndTime>{
            year: +fromToDateAndTime.fromYear,
            month: +fromToDateAndTime.fromMonth,
            day: +fromToDateAndTime.fromDay,
            minute: +fromToDateAndTime.fromMinute
        };
        return result;
    }

    private getToDateAndTime(fromToDateAndTime: IFromToDateAndTime): IDateAndTime {
        const result = <IDateAndTime>{
            year: +fromToDateAndTime.toYear,
            month: +fromToDateAndTime.toMonth,
            day: +fromToDateAndTime.toDay,
            minute: +fromToDateAndTime.toMinute
        };
        return result;
    }
}
