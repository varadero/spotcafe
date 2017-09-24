import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientDevicesStatusComponent } from './client-devices-status/client-devices-status.component';

const routes: Routes = [
    { path: 'client-devices-status', component: ClientDevicesStatusComponent },
    { path: 'reports', loadChildren: 'app/reports/reports.module#ReportsModule' },
    { path: 'settings', loadChildren: 'app/settings/settings.module#SettingsModule' },
    { path: '', redirectTo: 'client-devices-status', pathMatch: 'full' }
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
