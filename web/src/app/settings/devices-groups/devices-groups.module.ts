import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { DevicesGroupsRoutingModule } from './devices-groups-routing.module';
import { DevicesGroupsComponent } from './devices-groups.component';

@NgModule({
    declarations: [DevicesGroupsComponent],
    imports: [
        SharedModule,
        DevicesGroupsRoutingModule
    ]
})
export class DevicesGroupsModule { }
