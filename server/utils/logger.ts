import * as fs from 'fs';

export class Logger {
    showTimestamp = true;

    constructor(private logFilePath: string) {
    }

    log(text: string, ...optionalParams: any[]) {
        this.exec(console.log, text, ...optionalParams);
    }

    error(text: string, ...optionalParams: any[]) {
        this.exec(console.error, text, ...optionalParams);
    }

    private exec(func: Function, text: string, ...optionalParams: any[]) {
        if (this.showTimestamp) {
            text = (new Date()).toISOString() + ': ' + text;
        }
        if (optionalParams) {
            func(text, ...optionalParams);
        } else {
            func(text);
        }
        this.saveToFile(text, ...optionalParams);
    }

    private saveToFile(text: string, ...optionalParams: any[]) {
        if (!this.logFilePath) {
            return;
        }
        try {
            let data = text;
            if (optionalParams && optionalParams.length > 0) {
                for (const optionalParam of optionalParams) {
                    let optionalParamString = '';
                    if (typeof optionalParams === 'object') {
                        try {
                            optionalParamString = JSON.stringify(optionalParam);
                            if (optionalParamString === '{}') {
                                optionalParamString = `${optionalParam.message} : ${optionalParam.stack}`;
                            }
                        } catch (stringifyErr) {
                            optionalParamString = `<Can't stringify '${optionalParam}'>`;
                        }
                    } else {
                        optionalParamString = optionalParam;
                    }
                    data += ' ; ' + optionalParamString;
                }
            }
            data += '\r\n';
            fs.appendFileSync(this.logFilePath, data);
        } catch (err) {
            console.error(`Error on saving log to file ${this.logFilePath}: ${err}`);
        }
    }
}
