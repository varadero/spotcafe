import { NgModule } from '@angular/core';

import { SettingsRoutingModule } from './setings-routing.module';
import { SettingsComponent } from './settings.component';
import { SettingsHomeComponent } from './settings-home.component';

@NgModule({
    declarations: [
        SettingsComponent,
        SettingsHomeComponent
    ],
    imports: [
        SettingsRoutingModule
    ],
    exports: [
        SettingsRoutingModule
    ]
})
export class SettingsModule { }
