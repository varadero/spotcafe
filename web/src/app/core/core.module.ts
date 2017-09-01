import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { MaterialSubsetModule } from '../shared/material-subset.module';
import { DataService } from './data.sevice';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';

@NgModule({
    imports: [
        MaterialSubsetModule,
        HttpClientModule
    ],
    exports: [
        MaterialSubsetModule,
        HttpClientModule
    ],
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
