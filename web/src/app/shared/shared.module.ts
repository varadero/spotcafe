import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialSubsetModule } from './material-subset.module';

const allModules = [
    HttpModule,
    CommonModule,
    FormsModule,
    MaterialSubsetModule
];

@NgModule({
    imports: allModules,
    exports: allModules
})
export class SharedModule { }
