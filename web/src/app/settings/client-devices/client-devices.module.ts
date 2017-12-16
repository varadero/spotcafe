import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ClientDevicesRoutingModule } from './client-devices-routing.module';
import { ClientDevicesService } from './client-devices.service';
import { ClientDevicesComponent } from './client-devices.component';
import { ClientDeviceComponent } from './client-device.component';

@NgModule({
    declarations: [
        ClientDevicesComponent,
        ClientDeviceComponent
    ],
    imports: [
        SharedModule,
        ClientDevicesRoutingModule
    ],
    providers: [ClientDevicesService]
})
export class ClientDevicesModule { }
