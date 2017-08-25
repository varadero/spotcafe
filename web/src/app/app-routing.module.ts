import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ComputersComponent } from './computers/computers.component';

const routes: Routes = [
    { path: 'computers', component: ComputersComponent },
    { path: 'reports', loadChildren: 'app/reports/reports.module#ReportsModule' },
    { path: 'settings', loadChildren: 'app/settings/settings.module#SettingsModule' },
    { path: '', redirectTo: 'computers', pathMatch: 'full' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }
