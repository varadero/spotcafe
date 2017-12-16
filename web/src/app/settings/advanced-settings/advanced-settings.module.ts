import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { AdvancedSettingsRoutingModule } from './advanced-settings-routing.module';
import { AdvancedSettingsComponent } from './advanced-settings.component';

@NgModule({
    declarations: [
        AdvancedSettingsComponent
    ],
    imports: [
        SharedModule,
        AdvancedSettingsRoutingModule
    ]
})
export class AdvancedSettingsModule { }
