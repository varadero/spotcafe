import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { MaterialSubsetModule } from '../shared/material-subset.module';
import { DataService } from './data.sevice';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';

const allModules = [
    MaterialSubsetModule,
    HttpClientModule,
    BrowserModule
];

@NgModule({
    imports: allModules,
    exports: allModules,
    providers: [
        DataService,
        AuthService,
        CacheService
    ]
})
export class CoreModule {
    constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule must be loaded only in the AppModule');
        }
    }
}
