import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { SettingsHomeComponent } from './settings-home.component';
import { EmployeesComponent } from './employees/employees.component';
import { DisplayMessagesComponent } from '../shared/display-messages.component';

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [
            {
                path: 'home',
                component: SettingsHomeComponent
            },
            {
                path: 'employees',
                component: EmployeesComponent
            }
        ]
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
