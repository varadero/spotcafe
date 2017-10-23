import { Component } from '@angular/core';

import { IDateTimeSelectorModel } from '../../shared/date-time-selector/date-time-selector.component';
import { DataService } from '../../core/data.service';
import { ITotalsByClientDeviceAndEmployee } from '../../../../../shared/interfaces/totals-by-client-device-and-employee';
import { ReportsService } from '../reports.service';

@Component({
    templateUrl: './totals-by.component.html',
    styleUrls: ['./totals-by.component.css']
})
export class TotalsByComponent {
    startedAfter = <IDateTimeSelectorModel>{};
    stoppedBefore = <IDateTimeSelectorModel>{};
    report: ITotalsByClientDeviceAndEmployee;

    constructor(private dataSvc: DataService, private reportsSvc: ReportsService) {
    }

    async load(): Promise<void> {
        try {
            const from = this.reportsSvc.toDateTime(this.startedAfter);
            const to = this.reportsSvc.toDateTime(this.stoppedBefore);
            this.report = await this.dataSvc.getTotalsByClientDeviceAndEmployee(from, to);
        } catch (err) {

        } finally {

        }
    }
}
