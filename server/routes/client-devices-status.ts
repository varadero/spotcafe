import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';
import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';
import { IStartClientDeviceResult } from '../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceResult } from '../../shared/interfaces/stop-client-device-result';
import { calcEngine } from '../utils/calc-engine';
import { Time } from '../utils/time';

import { IStopClientDeviceData } from '../storage/stop-client-device-data';
import { IStartClientDeviceData } from '../storage/start-client-device-data';
import { IServerToken } from './interfaces/server-token';
import { ICalculatedDeviceBillData } from '../utils/calculated-device-bill-data';

export class ClientDevicesStatusRoutes extends RoutesBase {

    private time = new Time();

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    stopDevice(): any {
        return route.post(this.apiPrefix + 'client-devices-status/:id/stop', async ctx => {
            await this.handleActionResult(ctx, () => this.stopDeviceImpl(ctx.request.body, this.getServerToken(ctx)));
        });
    }

    startDevice(): any {
        return route.post(this.apiPrefix + 'client-devices-status/:id/start', async ctx => {
            await this.handleActionResult(ctx, () => this.startDeviceImpl(ctx.request.body, this.getServerToken(ctx)));
        });
    }

    getClientDevicesStatus(): any {
        return route.get(this.apiPrefix + 'client-devices-status', async ctx => {
            await this.handleActionResult(ctx, () => this.getClientDevicesStatusImpl());
        });
    }

    private async stopDeviceImpl(
        args: IStartClientDeviceArgs,
        serverToken: IServerToken
    ): Promise<IRouteActionResult<IStopClientDeviceResult | null> | void> {
        // const currentStatus = await this.storageProvider.getClientDeviceStatus(args.deviceId);
        // const bill = calcEngine.calcBill({
        //     startedAt: currentStatus.startedAt,
        //     startedAtUptime: currentStatus.startedAtUptime,
        //     pricePerHour: currentStatus.pricePerHour
        // });
        const bill = await calcEngine.loadStartedDeviceAndCalcBill(args.deviceId);
        let result: IStopClientDeviceResult | null = null;
        if (bill) {
            const data = <IStopClientDeviceData>{
                args: args,
                lastBill: bill.calcBillResult.totalBill,
                stoppedAt: this.time.getCurrentTime(),
                stoppedAtUptime: this.time.getCurrentUptime()
            };
            if (this.isServerTokenEmployee(serverToken)) {
                data.stoppedByEmployeeId = serverToken.accountId;
            }
            result = await this.storageProvider.stopClientDevice(data);
        }
        return { value: result };
    }

    private async startDeviceImpl(
        args: IStartClientDeviceArgs,
        serverToken: IServerToken
    ): Promise<IRouteActionResult<IStartClientDeviceResult> | void> {
        const data = <IStartClientDeviceData>{
            args: args,
            startedAt: this.time.getCurrentTime(),
            startedAtUptime: this.time.getCurrentUptime()
        };
        if (this.isServerTokenEmployee(serverToken)) {
            data.startedByEmployeeId = serverToken.accountId;
        } else if (this.isServerTokenClient(serverToken)) {
            data.startedByClientId = serverToken.accountId;
        }
        const result = await this.storageProvider.startClientDevice(data);
        if (result.startedDeviceCallBillData) {
            calcEngine.setClientDeviceStarted(result.startedDeviceCallBillData);
        }
        return { value: { alreadyStartedInfo: result.clientDeviceAlreadyStartedInfo } };
    }

    private async getClientDevicesStatusImpl(): Promise<IRouteActionResult<IClientDeviceStatus[]> | void> {
        const status = await this.storageProvider.getClientDevicesStatus();
        const lastCalcData = calcEngine.getLastCalcData();
        this.setLastCalcDataToClientDeviceStatus(lastCalcData, status);
        return { value: status };
    }

    private setLastCalcDataToClientDeviceStatus(
        calcData: ICalculatedDeviceBillData[],
        clientDevicesStatus: IClientDeviceStatus[]
    ): void {
        for (let i = 0; i < clientDevicesStatus.length; i++) {
            const item = clientDevicesStatus[i];
            const billData = this.findBillData(calcData, item.deviceId);
            if (billData) {
                item.duration = billData.calcBillResult.timeUsed;
                item.bill = billData.calcBillResult.totalBill;
            } else {
                if (item.startedAt && item.startedAtUptime && item.stoppedAt && item.stoppedAtUptime) {
                    item.duration = calcEngine.getMaxDiff(item.startedAt, item.startedAtUptime, item.stoppedAt, item.stoppedAtUptime);
                }
            }
        }
    }

    private findBillData(billsData: ICalculatedDeviceBillData[], deviceId: string): ICalculatedDeviceBillData | null {
        return billsData.find(x => x.calcBillData.deviceId === deviceId) || null;
    }
}
