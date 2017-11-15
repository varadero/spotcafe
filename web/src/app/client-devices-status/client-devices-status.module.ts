import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { ClientDevicesStatusRoutingModule } from './client-devices-status-routing.module';
import { ClientDevicesStatusComponent } from './client-devices-status.component';
import { ClientDevicesStatusService } from './client-devices-status.service';
import { ClientDeviceProcessesComponent } from './client-device-processes.component';

@NgModule({
    declarations: [
        ClientDevicesStatusComponent,
        ClientDeviceProcessesComponent
    ],
    imports: [
        SharedModule,
        ClientDevicesStatusRoutingModule
    ],
    providers: [
        ClientDevicesStatusService
    ]
})
export class ClientDevicesStatusModule { }
