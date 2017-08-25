import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { SettingsHomeComponent } from './settings-home.component';

const routes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [
            {
                path: 'home',
                component: SettingsHomeComponent
            }
        ]
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
export class SettingsRoutingModule { }
