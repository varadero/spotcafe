export class ErrorMessage {
    create(message: string): string {
        return JSON.stringify({
            message: message
        });
    }
}
