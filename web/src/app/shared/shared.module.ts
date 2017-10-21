import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialSubsetModule } from './material-subset.module';
import { DisplayMessagesComponent } from './display-messages.component';
import { DateTimeSelectorComponent } from './date-time-selector/date-time-selector.component';
import { DurationPipe } from './duration.pipe';
import { MoneyPipe } from './money.pipe';
import { MessagesService } from './messages.service';
import { ErrorsService } from './errors.service';

const allModules = [
    CommonModule,
    FormsModule,
    MaterialSubsetModule
];

@NgModule({
    declarations: [
        DisplayMessagesComponent,
        DateTimeSelectorComponent,
        DurationPipe,
        MoneyPipe
    ],
    imports: allModules,
    exports: [
        ...allModules,
        DisplayMessagesComponent,
        DateTimeSelectorComponent,
        DurationPipe,
        MoneyPipe
    ],
    providers: [MessagesService, ErrorsService]
})
export class SharedModule { }
