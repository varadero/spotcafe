import { NgModule } from '@angular/core';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
    declarations: [
        ReportsComponent
    ],
    imports: [
        SharedModule,
        ReportsRoutingModule
    ],
    exports: [
        ReportsRoutingModule
    ]
})
export class ReportsModule { }
