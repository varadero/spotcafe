import { Component, Input, OnInit } from '@angular/core';

import { MessagesService } from './messages.service';
import { IMessage } from './message';

@Component({
    selector: 'spotcafe-messages',
    styles: [`
        .message-success {
            background-color: springgreen;
        }
        .message-info {
            background-color: skyblue;
        }
        .message-warning {
            background-color: yellow;
        }
        .message-error {
            background-color: coral;
        }
        .message {
            line-height: 2em;
            padding-left: 8px;
            padding-right: 8px;
            margin: 2px;
        }
    `],
    template: `
        <div>
            <div *ngFor="let message of messages" class="message message-{{message.type}}">
                {{message.text}}
            </div>
        </div>
    `
})
export class DisplayMessagesComponent implements OnInit {
    messages: IMessage[] = [];
    @Input() staticMessage: IMessage = null;

    private timeout = 5000;

    constructor(private messagesSvc: MessagesService) { }

    ngOnInit(): void {
        if (this.staticMessage) {
            this.messages.push(this.staticMessage);
        }
    }

    addSuccessMessage(text: string): void {
        this.addMessage(text, 'success');
    }

    addInfoMessage(text: string): void {
        this.addMessage(text, 'info');
    }

    addWarningMessage(text: string): void {
        this.addMessage(text, 'warning');
    }

    addErrorMessage(text: string): void {
        this.addMessage(text, 'error');
    }

    addMessage(text: string, type: string): void {
        const msg: IMessage = { text, type, addedAt: new Date().getTime() };
        this.messagesSvc.addMessage(msg);
        this.messages.push(msg);
        setTimeout(() => {
            this.messages = this.messages.filter(x => x !== msg);
        }, this.timeout);
    }
}
