import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { IMessage } from './message';

@Injectable()
export class MessagesService {
    messages: IMessage[] = [];

    constructor(private snackBarSvc: MatSnackBar) {
    }

    addSuccessMessage(text: string): void {
        this.addMessage({ text: text, type: 'success' });
    }

    addErrorMessage(text: string): void {
        this.addMessage({ text: text, type: 'error' });
    }

    addMessage(message: IMessage): void {
        message.addedAt = Date.now();
        this.messages.push(message);
        const additionalClass = 'alert-' + message.type;
        this.snackBarSvc.open(message.text, undefined, { duration: 10000, extraClasses: [additionalClass] });
    }
}
