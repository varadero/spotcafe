export interface IClientDeviceStatus {
    deviceId: string;
    name: string;
    isStarted: boolean;
    startedAt?: number;
    stoppedAt?: number;
    startedAtUptime?: number;
    stoppedAtUptime?: number;
    lastBill?: number;
    duration: number;
    bill: number;
    pricePerHour: number;
}
