export interface IServerToken {
    accountId: string;
    deviceId: string;
    type: 'employee' | 'client' | 'client-device';
    exp: number;
    iat: number;
    permissions: string;
}
