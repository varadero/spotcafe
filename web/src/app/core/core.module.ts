import { NgModule, Optional, SkipSelf } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';

import { MaterialSubsetModule } from '../shared/material-subset.module';
import { DataService } from './data.sevice';
import { AuthService } from './auth.service';

@NgModule({
    imports: [
        MaterialSubsetModule,
        HttpModule,
        // CommonModule
    ],
    exports: [
        MaterialSubsetModule,
        HttpModule,
        // CommonModule
    ],
    providers: [
        DataService,
        AuthService
    ]
})
export class CoreModule {
    constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule must be loaded only in the AppModule');
        }
    }
}
