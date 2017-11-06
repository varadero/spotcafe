import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { IMessage } from './message';

@Injectable()
export class MessagesService {
    messages: IMessage[] = [];

    constructor(private snackBarSvc: MatSnackBar) {
    }

    addMessage(message: IMessage) {
        this.messages.push(message);
        const additionalClass = 'alert-' + message.type;
        this.snackBarSvc.open(message.text, undefined, { duration: 10000, extraClasses: [additionalClass] });
    }
}
