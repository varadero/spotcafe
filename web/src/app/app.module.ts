import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from './core/core.module';
import { SettingsModule } from './settings/settings.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ComputersComponent } from './computers/computers.component';

@NgModule({
  declarations: [
    AppComponent,
    ComputersComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    SettingsModule,
    AppRoutingModule,
    NoopAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
