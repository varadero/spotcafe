import { Injectable } from '@angular/core';

import { IMessage } from './message';

@Injectable()
export class MessagesService {
    messages: IMessage[] = [];

    addMessage(message: IMessage) {
        this.messages.push(message);
    }
}
