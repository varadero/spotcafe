import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialSubsetModule } from './material-subset.module';
import { DisplayMessagesComponent } from './display-messages.component';
import { MessagesService } from './messages.service';

const allModules = [
    CommonModule,
    FormsModule,
    MaterialSubsetModule
];

@NgModule({
    declarations: [DisplayMessagesComponent],
    imports: allModules,
    exports: [...allModules, DisplayMessagesComponent],
    providers: [MessagesService]
})
export class SharedModule { }
