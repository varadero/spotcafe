import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from './core/core.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClientDevicesStatusComponent } from './client-devices-status/client-devices-status.component';
import { ClientDevicesStatusService } from './client-devices-status/client-devices-status.service';

@NgModule({
  declarations: [
    AppComponent,
    ClientDevicesStatusComponent
  ],
  imports: [
    CoreModule,
    AppRoutingModule,
    NoopAnimationsModule
  ],
  providers: [ClientDevicesStatusService],
  bootstrap: [AppComponent]
})
export class AppModule { }
