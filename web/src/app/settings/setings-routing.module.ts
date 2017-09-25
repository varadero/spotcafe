import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { EmployeesComponent } from './employees/employees.component';
// import { DisplayMessagesComponent } from '../shared/display-messages.component';
import { ClientDevicesComponent } from './client-devices/client-devices.component';
import { RolesComponent } from './roles/roles.component';

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [{
            path: 'employees',
            component: EmployeesComponent
        }, {
            path: 'client-devices',
            component: ClientDevicesComponent
        }, {
            path: 'roles',
            component: RolesComponent
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
export class SettingsRoutingModule { }
