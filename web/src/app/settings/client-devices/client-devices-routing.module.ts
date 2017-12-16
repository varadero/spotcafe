import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientDevicesComponent } from './client-devices.component';

const routes: Routes = [
    { path: '', component: ClientDevicesComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)]
})
export class ClientDevicesRoutingModule { }
