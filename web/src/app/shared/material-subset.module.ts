import { NgModule } from '@angular/core';

import {
    MdListModule,
    MdButtonModule,
    MdSidenavModule,
    MdIconModule,
    MdCheckboxModule,
    MdCardModule,
    MdTabsModule,
    MdInputModule,
    MdSelectModule,
    MdFormFieldModule
} from '@angular/material';

const allModules = [
    MdListModule,
    MdButtonModule,
    MdSidenavModule,
    MdIconModule,
    MdCheckboxModule,
    MdCardModule,
    MdTabsModule,
    MdInputModule,
    MdSelectModule,
    MdFormFieldModule
];

@NgModule({
    imports: allModules,
    exports: allModules
})
export class MaterialSubsetModule { }
