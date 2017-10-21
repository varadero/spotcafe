import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientDevicesStatusComponent } from './client-devices-status.component';

const routes: Routes = [
    {
        path: '',
        component: ClientDevicesStatusComponent
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes)
    ],
    exports: [
        RouterModule
    ]
})
export class ClientDevicesStatusRoutingModule { }
