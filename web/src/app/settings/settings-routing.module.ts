import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [{
            path: 'employees',
            loadChildren: './employees/employees.module#EmployeesModule'
        }, {
            path: 'client-devices',
            loadChildren: './client-devices/client-devices.module#ClientDevicesModule'
        }, {
            path: 'roles',
            loadChildren: './roles/roles.module#RolesModule'
        }, {
            path: 'devices-groups',
            loadChildren: './devices-groups/devices-groups.module#DevicesGroupsModule'
        }, {
            path: 'clients-groups',
            loadChildren: './clients-groups/clients-groups.module#ClientsGroupsModule'
        }, {
            path: 'clients',
            loadChildren: './clients/clients.module#ClientsModule'
        }, {
            path: 'application-profiles',
            loadChildren: './application-profiles/application-profiles.module#ApplicationProfilesModule'
        }, {
            path: 'advanced-settings',
            loadChildren: './advanced-settings/advanced-settings.module#AdvancedSettingsModule'
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
