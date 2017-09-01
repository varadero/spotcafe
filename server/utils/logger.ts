export class Logger {
    showTimestamp = true;

    log(text: string, optionalParams?: any[]) {
        this.exec(console.log, text, optionalParams);
    }

    error(text: string, optionalParams?: any[]) {
        this.exec(console.error, text, optionalParams);
    }

    private exec(func: Function, text: string, optionalParams?: any[]) {
        if (this.showTimestamp) {
            text = (new Date()).toISOString() + ': ' + text;
        }
        if (optionalParams) {
            func(text, optionalParams);
        } else {
            func(text);
        }
    }
}
