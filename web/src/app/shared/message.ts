export interface IMessage {
    addedAt?: number;
    text: string;
    type: 'success' | 'info' | 'warning' | 'error';
}
