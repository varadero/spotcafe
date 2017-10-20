import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReportsComponent } from './reports.component';
import { TotalsByComponent } from './totals-by/totals-by.component';

const routes: Routes = [
    {
        path: '',
        component: ReportsComponent,
        children: [{
            path: 'totals-by',
            component: TotalsByComponent
        }]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class ReportsRoutingModule { }
