import { Component } from '@angular/core';

import { IDateAndTime } from '../../../../../shared/interfaces/date-and-time';
import { IDateTimeSelectorModel } from '../../shared/date-time-selector/date-time-selector.component';
import { DataService } from '../../core/data.service';
import { ITotalsByClientDeviceAndEmployee } from '../../../../../shared/interfaces/totals-by-client-device-and-employee';

@Component({
    templateUrl: './totals-by.component.html',
    styleUrls: ['./totals-by.component.css']
})
export class TotalsByComponent {
    startedAfter = <IDateTimeSelectorModel>{};
    stoppedBefore = <IDateTimeSelectorModel>{};
    report: ITotalsByClientDeviceAndEmployee;

    constructor(private dataSvc: DataService) {
    }

    async load(): Promise<void> {
        try {
            const from = this.toDateTime(this.startedAfter);
            const to = this.toDateTime(this.stoppedBefore);
            this.report = await this.dataSvc.getTotalsByClientDeviceAndEmployee(from, to);
        } catch (err) {

        } finally {

        }
    }

    private toDateTime(value: IDateTimeSelectorModel): IDateAndTime {
        const result = <IDateAndTime>{
            year: value.selectedYear.value,
            month: value.selectedMonth.value,
            day: value.selectedDay.value,
            minute: value.selectedHour.value
        };
        return result;
    }
}
