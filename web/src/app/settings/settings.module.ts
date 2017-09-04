import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { SettingsHomeComponent } from './settings-home.component';
import { EmployeesComponent } from './employees/employees.component';
import { EmployeesServce } from './employees/employees.services';

@NgModule({
    declarations: [
        SettingsComponent,
        SettingsHomeComponent,
        EmployeesComponent
    ],
    imports: [
        SharedModule,
        SettingsRoutingModule
    ],
    exports: [
        SettingsRoutingModule
    ],
    providers: [
        EmployeesServce
    ]
})
export class SettingsModule { }
