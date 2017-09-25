export interface IClientDeviceStatus {
    deviceId: string;
    name: string;
    isStarted: boolean;
    startedAt: number;
    stoppedAt: number;
    duration: number;
    bill: number;
}
