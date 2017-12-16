import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientsGroupsComponent } from './clients-groups.component';

const routes: Routes = [
    { path: '', component: ClientsGroupsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class ClientsGroupsRoutingModule { }
