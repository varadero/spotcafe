import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'client-devices-status',
        loadChildren: 'app/client-devices-status/client-devices-status.module#ClientDevicesStatusModule'
    },
    {
        path: 'reports',
        loadChildren: 'app/reports/reports.module#ReportsModule'
    },
    {
        path: 'settings',
        loadChildren: 'app/settings/settings.module#SettingsModule'
    },
    {
        path: '',
        redirectTo: 'client-devices-status',
        pathMatch: 'full'
    }
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
