import { NgModule } from '@angular/core';

import {
    MatListModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatGridListModule,
    MatMenuModule
} from '@angular/material';

const allModules = [
    MatListModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatGridListModule,
    MatMenuModule
];

@NgModule({
    imports: allModules,
    exports: allModules
})
export class MaterialSubsetModule { }
