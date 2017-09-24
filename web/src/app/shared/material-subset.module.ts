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
    MdFormFieldModule,
    MdSnackBarModule,
    MdGridListModule
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
    MdFormFieldModule,
    MdSnackBarModule,
    MdGridListModule
];

@NgModule({
    imports: allModules,
    exports: allModules
})
export class MaterialSubsetModule { }
