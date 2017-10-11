import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { EmployeesComponent } from './employees/employees.component';
import { EmployeesService } from './employees/employees.services';
import { ClientDevicesComponent } from './client-devices/client-devices.component';
import { ClientDeviceComponent } from './client-devices/client-device.component';
import { ClientDevicesService } from './client-devices/client-devices.service';
import { RolesComponent } from './roles/roles.component';
import { RolesService } from './roles/roles.service';
import { DevicesGroupsComponent } from './devices-groups/devices-groups.component';
import { ClientsGroupsComponent } from './clients-groups/clients-groups.component';
import { ClientsGroupsService } from './clients-groups/clients-groups.service';
import { ClientsComponent } from './clients/clients.component';
import { ClientsService } from './clients/clients.service';
import { ClientComponent } from './clients/client.component';
import { DurationPipe } from '../core/duration.pipe';

@NgModule({
    declarations: [
        SettingsComponent,
        EmployeesComponent,
        ClientDevicesComponent,
        ClientDeviceComponent,
        DevicesGroupsComponent,
        ClientsGroupsComponent,
        ClientsComponent,
        ClientComponent,
        RolesComponent,
        DurationPipe
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
        RolesService,
        ClientDevicesService,
        ClientsService,
        ClientsGroupsService
    ]
})
export class SettingsModule { }
