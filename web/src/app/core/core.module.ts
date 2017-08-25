import { NgModule, Optional, SkipSelf } from '@angular/core';

import { MaterialSubsetModule } from './material-subset.module';

@NgModule({
    imports: [
        MaterialSubsetModule
    ],
    exports: [
        MaterialSubsetModule
    ]
})
export class CoreModule {
    constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule must be loaded only in the AppModule');
        }
    }
}
