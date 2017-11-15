import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { DataService } from './data.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { WebSocketService } from './web-socket.service';
import { WebSocketUtilsService } from './web-socket-utils.service';

const allModules = [
    HttpClientModule
];

@NgModule({
    imports: allModules,
    exports: [
        ...allModules
    ],
    providers: [
        DataService,
        AuthService,
        CacheService,
        WebSocketService,
        WebSocketUtilsService
    ]
})
export class CoreModule {
    constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule must be loaded only in the AppModule');
        }
    }
}
