import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DevicesGroupsComponent } from './devices-groups.component';

const routes: Routes = [
    { path: '', component: DevicesGroupsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class DevicesGroupsRoutingModule { }
