import { NgModule } from '@angular/core';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';

@NgModule({
    declarations: [
        ReportsComponent
    ],
    imports: [
        ReportsRoutingModule
    ],
    exports: [
        ReportsRoutingModule
    ]
})
export class ReportsModule { }
