import { Injectable } from '@angular/core';

@Injectable()
export class ErrorsService {
    getNetworkErrorMessage(err: any, messagePrefix: string): string {
        if (!err) {
            return messagePrefix;
        }
        let result;
        if (err.error) {
            try {
                if (typeof err.error.message === 'string') {
                    result = err.error.message;
                } else if (typeof err.error === 'object') {
                    result = JSON.stringify(err.error);
                }
            } catch (err) {
                result = err.error;
            }
        } else {
            result = `${err.status} ${err.statusText}`;
        }

        result = messagePrefix ? `${messagePrefix} ${result}` : result;
        return result;
    }
}
