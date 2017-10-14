export interface ILogInAndGetClientDataResult {
    notFound: boolean;
    disabled: boolean;
    clientId: string;
    pricePerHour: number;
    credit: number;
}
