import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientsComponent } from './clients.component';

const routes: Routes = [
    { path: '', component: ClientsComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class ClientsRoutingModule { }
