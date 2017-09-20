import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { EmployeesComponent } from './employees/employees.component';
import { EmployeesService } from './employees/employees.services';
import { ClientDevicesComponent } from './client-devices/client-devices.component';
import { RolesComponent } from './roles/roles.component';
import { RolesService } from './roles/roles.service';

@NgModule({
    declarations: [
        SettingsComponent,
        EmployeesComponent,
        ClientDevicesComponent,
        RolesComponent
    ],
    imports: [
        SharedModule,
        SettingsRoutingModule
    ],
    exports: [
        SettingsRoutingModule
    ],
    providers: [
        EmployeesService,
        RolesService
    ]
})
export class SettingsModule { }
