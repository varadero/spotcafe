import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ClientsGroupsRoutingModule } from './clients-groups-routing.module';
import { ClientsGroupsComponent } from './clients-groups.component';
import { ClientsGroupsService } from './clients-groups.service';

@NgModule({
    declarations: [ClientsGroupsComponent],
    imports: [
        SharedModule,
        ClientsGroupsRoutingModule
    ],
    providers: [ClientsGroupsService]
})
export class ClientsGroupsModule { }
