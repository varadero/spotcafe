import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ClientsRoutingModule } from './clients-routing.module';
import { ClientsService } from './clients.service';
import { ClientsComponent } from './clients.component';
import { ClientComponent } from './client.component';

@NgModule({
    declarations: [
        ClientsComponent,
        ClientComponent
    ],
    imports: [
        SharedModule,
        ClientsRoutingModule
    ],
    providers: [ClientsService]
})
export class ClientsModule { }
