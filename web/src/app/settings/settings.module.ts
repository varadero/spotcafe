import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { SettingsHomeComponent } from './settings-home.component';
import { SettingsEmployeesComponent } from './settings-employees';
import { SettingsService } from './settings.service';

@NgModule({
    declarations: [
        SettingsComponent,
        SettingsHomeComponent,
        SettingsEmployeesComponent
    ],
    imports: [
        SettingsRoutingModule,
        SharedModule
    ],
    exports: [
        SettingsRoutingModule
    ],
    providers: [
        SettingsService
    ]
})
export class SettingsModule { }
