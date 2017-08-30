import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { MaterialSubsetModule } from './material-subset.module';

@NgModule({
    imports: [
        MaterialSubsetModule,
        HttpModule,
        CommonModule
    ],
    exports: [
        MaterialSubsetModule,
        HttpModule,
        CommonModule
    ]
})
export class SharedModule { }
