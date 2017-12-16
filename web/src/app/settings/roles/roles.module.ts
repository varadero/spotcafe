import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { RolesRoutingModule } from './roles-routing.module';
import { RolesService } from './roles.service';
import { RolesComponent } from './roles.component';

@NgModule({
    declarations: [RolesComponent],
    imports: [
        SharedModule,
        RolesRoutingModule
    ],
    providers: [RolesService]
})
export class RolesModule { }
