export interface IStartedDeviceCalcBillData {
    deviceId: string;
    startedAt: number;
    startedAtUptime: number;
    startedByClientId?: string;
    startedByEmployeeId?: string;
    clientGroupPricePerHour: number;
    deviceGroupPricePerHour: number;
    clientCredit: number;
}
