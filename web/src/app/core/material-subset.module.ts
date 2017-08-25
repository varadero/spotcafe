import { NgModule } from '@angular/core';

import {
    MdListModule,
    MdButtonModule,
    MdSidenavModule,
    MdIconModule
} from '@angular/material';

@NgModule({
    imports: [
        MdListModule,
        MdButtonModule,
        MdSidenavModule,
        MdIconModule
    ],
    exports: [
        MdListModule,
        MdButtonModule,
        MdSidenavModule,
        MdIconModule
    ]
})
export class MaterialSubsetModule { }
