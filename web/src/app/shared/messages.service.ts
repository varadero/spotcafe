import { IMessage } from './message';

export class MessagesService {
    messages: IMessage[] = [];

    addMessage(message: IMessage) {
        this.messages.push(message);
    }
}
