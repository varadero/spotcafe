import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';

import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { ClientDevicesStatusComponent } from './client-devices-status/client-devices-status.component';
// import { ClientDevicesStatusService } from './client-devices-status/client-devices-status.service';

@NgModule({
  declarations: [
    AppComponent // ,
    // ClientDevicesStatusComponent
  ],
  imports: [
    CoreModule,
    BrowserModule,
    SharedModule,
    AppRoutingModule,
    NoopAnimationsModule
  ],
  providers: [
    // ClientDevicesStatusService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
