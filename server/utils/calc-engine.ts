import { StorageProvider } from '../storage/storage-provider';
import { Time } from './time';
import { IStartedDeviceCalcBillData } from '../storage/started-device-calc-bill-data';
import { ICalculatedDeviceBillData } from './calculated-device-bill-data';
import { Logger } from './logger';
import { IStopClientDeviceData } from '../storage/stop-client-device-data';
import { IStopClientDeviceResult } from '../../shared/interfaces/stop-client-device-result';

/**
 * Calculates devices bills and durations at regular intervals
 * And provides calculated data to other modules
 */
class CalcEngine {
    private static instance: CalcEngine;
    private config: InitializeOptions;
    private storageProvider: StorageProvider;
    private time = new Time();
    private lastCalculatedData: ICalculatedDeviceBillData[] = [];

    static get Instance(): CalcEngine {
        this.instance = this.instance || new CalcEngine();
        return this.instance;
    }

    initialize(options: InitializeOptions): void {
        this.config = options;
        this.storageProvider = this.config.storageProvider;
    }

    start(): void {
        this.calcLoop();
    }

    getLastCalcData(): ICalculatedDeviceBillData[] {
        return this.lastCalculatedData;
    }

    getLastCalcDataForDеvice(deviceId: string): ICalculatedDeviceBillData | null {
        const data = this.lastCalculatedData.find(x => x.calcBillData.deviceId === deviceId) || null;
        return data;
    }

    setClientDeviceStarted(billData: IStartedDeviceCalcBillData): void {
        this.calcBillsAndAddToLastCalcData([billData]);
    }

    setClientDeviceStopped(deviceId: string): void {
        const index = this.lastCalculatedData.findIndex(x => x.calcBillData && x.calcBillData.deviceId === deviceId);
        if (index >= 0) {
            this.lastCalculatedData.splice(index, 1);
        }
    }

    /**
     * Contacts storage and calculates started device bill. For use when the device is about to be stopped
     * @param deviceId Device id
     */
    async loadStartedDeviceAndCalcBill(deviceId: string): Promise<ICalculatedDeviceBillData | null> {
        let billData: IStartedDeviceCalcBillData | null = null;
        try {
            // Get all devices with their status and prices per hour
            billData = await this.storageProvider.getStartedDeviceCalcBillData(deviceId);
        } catch (err) {
            this.logError(err);
        }
        if (!billData) {
            return null;
        }
        return this.calcBillsAndAddToLastCalcData([billData])[0];
    }

    /**
     * Calculates started devices bills and caches the data
     */
    async execCalcBillsAndSetLastData(): Promise<ICalculatedDeviceBillData[] | null> {
        const calculatedBills = await this.loadStartedDevicesAndCalculateBills();
        this.lastCalculatedData = calculatedBills;
        this.stopDevicesWithoutClientCredit(calculatedBills);
        return calculatedBills;
    }

    /**
     * Gets greater either duration between operating system uptimes or dates
     * @param startedAt Date and time when the device was started
     * @param startedAtUptime Operating system uptime when the device was started
     * @param stoppedAt Date and time when the device was stopped
     * @param stoppedAtUptime Operating system uptime when the device was stopped
     */
    getMaxDiff(
        startedAt: number,
        startedAtUptime: number,
        stoppedAt: number,
        stoppedAtUptime: number
    ): number {
        const uptimeDiff = stoppedAtUptime - startedAtUptime;
        const timeDiff = stoppedAt - startedAt;
        const maxTimeDiff = Math.max(uptimeDiff, timeDiff);
        return maxTimeDiff;
    }

    private async stopDevicesWithoutClientCredit(
        calculatedBills: ICalculatedDeviceBillData[]
    ): Promise<IStopClientDeviceResult[]> {
        // Stop all devices started for clients with bills greater than client credit
        const stopData: IStopClientDeviceData[] = [];
        for (const item of calculatedBills) {
            if (item.calcBillData && item.calcBillResult) {
                if (item.calcBillResult.isClient
                    && item.calcBillData.startedByClientId
                    && item.calcBillData.clientCredit
                    && item.calcBillResult.totalBill > item.calcBillData.clientCredit) {
                    stopData.push({
                        args: { deviceId: item.calcBillData.deviceId },
                        // Set client credit as last bill, not calculated totalBill
                        // This will make client credit 0 instead of (eventually) negative
                        lastBill: item.calcBillData.clientCredit,
                        stoppedAt: this.time.getCurrentTime(),
                        stoppedAtUptime: this.time.getCurrentUptime()
                    });
                }
            }
        }
        if (stopData.length > 0) {
            return await this.storageProvider.stopClientDevices(stopData);
        } else {
            return Promise.resolve([]);
        }
    }

    private calcBill(calcBillData: IStartedDeviceCalcBillData): ICalcBillResult {
        const result: ICalcBillResult = {
            timeUsed: 0,
            totalBill: 0,
            clientCredit: calcBillData.clientCredit,
            isClient: !!calcBillData.startedByClientId
        };

        if (!calcBillData.startedAt || !calcBillData.startedAtUptime) {
            return result;
        }
        const maxTimeDiff = this.getMaxDiff(
            calcBillData.startedAt,
            calcBillData.startedAtUptime,
            this.time.getCurrentTime(),
            this.time.getCurrentUptime()
        );
        if (maxTimeDiff < 0) {
            // TODO Something strange happened
            // Maybe server was restarted and the time was changed to a value before the device was started
        }
        // The diff is in milliseconds - convert to hours
        const diffSeconds = maxTimeDiff / 1000;
        const diffHours = diffSeconds / 3600;
        const pricePerHor = calcBillData.clientGroupPricePerHour || calcBillData.deviceGroupPricePerHour;
        const totalBill = Math.round(diffHours * pricePerHor * 100) / 100;

        result.timeUsed = maxTimeDiff;
        result.totalBill = totalBill;
        return result;
    }

    private async loadStartedDevicesAndCalculateBills(): Promise<ICalculatedDeviceBillData[]> {
        let billData: IStartedDeviceCalcBillData[] = [];
        try {
            // Get all devices with their status and prices per hour
            billData = await this.storageProvider.getStartedDevicesCalcBillData();
        } catch (err) {
            this.logError(err);
        }
        if (!billData) {
            return [];
        }
        return this.calcBillsAndAddToLastCalcData(billData);
    }

    private calcBillsAndAddToLastCalcData(calcBillsData: IStartedDeviceCalcBillData[]): ICalculatedDeviceBillData[] {
        const result: ICalculatedDeviceBillData[] = [];
        for (let i = 0; i < calcBillsData.length; i++) {
            const item = calcBillsData[i];
            const calcBillResult = this.calcBill(item);
            const existingCalcBillData = this.findCalcBillData(item.deviceId);
            if (!existingCalcBillData) {
                const newCalcBillData = { calcBillData: item, calcBillResult: calcBillResult };
                this.lastCalculatedData.push(newCalcBillData);
                result.push(newCalcBillData);
            } else {
                existingCalcBillData.calcBillData = item;
                existingCalcBillData.calcBillResult = calcBillResult;
                result.push(existingCalcBillData);
            }
        }
        return result;
    }

    private findCalcBillData(deviceId: string): ICalculatedDeviceBillData | null {
        return this.lastCalculatedData.find(x => x.calcBillData.deviceId === deviceId) || null;
    }

    private async calcLoop(): Promise<void> {
        setTimeout(() => {
            this.execCalcBillsAndSetLastData().then(() => {
                this.calcLoop();
            }, err => {
                this.logError(err);
                this.calcLoop();
            });
        }, this.config.billsCalcInterval);
    }

    // private logInfo(msg: string, ...optionalParams: any[]): void {
    //     if (this.config.logger) {
    //         this.config.logger.log(msg, ...optionalParams);
    //     }
    // }

    private logError(msg: string, ...optionalParams: any[]): void {
        if (this.config.logger) {
            this.config.logger.log(msg, ...optionalParams);
        }
    }
}

// Simulates singleton
export let calcEngine = new CalcEngine();

export class InitializeOptions {
    storageProvider: StorageProvider;
    billsCalcInterval: number;
    logger: Logger;
}

export interface ICalcBillResult {
    totalBill: number;
    isClient: boolean;
    clientCredit: number;
    timeUsed: number;
}

export interface IClientDeviceCalcBillData {
    startedAt?: number;
    startedAtUptime?: number;
    pricePerHour: number;
}
