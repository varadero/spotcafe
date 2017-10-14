import { IToken } from './token';

export interface ILogInClientResult {
    token: IToken;
    disabled: boolean;
    pricePerHour: number;
    credit: number;
}
