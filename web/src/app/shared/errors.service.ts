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
                } else if (typeof err.error === 'string') {
                    result = err.error;
                } else if (typeof err.error === 'object') {
                    const errMessage = (err.message) ? err.message + ' ' : '';
                    result = errMessage + JSON.stringify(err.error);
                } else if (typeof err.statusText === 'string') {
                    result = err.statusText;
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
