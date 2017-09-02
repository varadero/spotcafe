export interface IServerToken {
    accountId: string;
    type: string;
    exp: number;
    iat: number;
    permissions: string;
}
