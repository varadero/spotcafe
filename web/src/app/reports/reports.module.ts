import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { TotalsByComponent } from './totals-by/totals-by.component';
import { TotalsByTableComponent } from './totals-by/totals-by-table.component';
import { ReportsService } from './reports.service';

@NgModule({
    declarations: [
        ReportsComponent,
        TotalsByComponent,
        TotalsByTableComponent
    ],
    imports: [
        SharedModule,
        ReportsRoutingModule
    ],
    exports: [
        ReportsRoutingModule
    ],
    providers: [
        ReportsService
    ]
})
export class ReportsModule { }
