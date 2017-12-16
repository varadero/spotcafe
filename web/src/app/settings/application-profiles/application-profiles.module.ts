import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { ApplicationProfilesRoutingModule } from './application-profiles-routing.module';
import { ApplicationProfilesComponent } from './application-profiles.component';
import { ApplicationProfileFileComponent } from './application-profile-file.component';
import { ApplicationProfileFileListItemComponent } from './application-profile-file-list-item.component';

@NgModule({
    declarations: [
        ApplicationProfilesComponent,
        ApplicationProfileFileComponent,
        ApplicationProfileFileListItemComponent
    ],
    imports: [
        SharedModule,
        ApplicationProfilesRoutingModule
    ]
})
export class ApplicationProfilesModule { }
