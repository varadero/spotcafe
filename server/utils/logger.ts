export class Logger {

    public showTimestamp = true;

    log(text: string) {
        this.exec(console.log, text);
    }

    error(text: string) {
        this.exec(console.error, text);
    }

    private exec(func: Function, text: string) {
        if (this.showTimestamp) {
            text = (new Date()).toISOString() + ': ' + text;
        }
        func(text);
    }
}
