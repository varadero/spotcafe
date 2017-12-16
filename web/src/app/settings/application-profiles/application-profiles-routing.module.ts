import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApplicationProfilesComponent } from './application-profiles.component';

const routes: Routes = [
    { path: '', component: ApplicationProfilesComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class ApplicationProfilesRoutingModule { }
