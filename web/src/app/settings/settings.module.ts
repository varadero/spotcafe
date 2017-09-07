import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { EmployeesComponent } from './employees/employees.component';
import { EmployeesService } from './employees/employees.services';
import { ClientDevicesComponent } from './client-devices/client-devices.component';

@NgModule({
    declarations: [
        SettingsComponent,
        EmployeesComponent,
        ClientDevicesComponent
    ],
    imports: [
        SharedModule,
        SettingsRoutingModule
    ],
    exports: [
        SettingsRoutingModule
    ],
    providers: [
        EmployeesService
    ]
})
export class SettingsModule { }
