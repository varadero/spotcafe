import { Component, Input } from '@angular/core';

import { IReportTotalsByEntity } from '../../../../../shared/interfaces/report-totals-by-entity';

@Component({
    selector: 'spotcafe-totals-by-table',
    templateUrl: './totals-by-table.component.html',
    styleUrls: ['./totals-by-table.component.css']
})
export class TotalsByTableComponent {
    @Input() rows: IReportTotalsByEntity[];
}
