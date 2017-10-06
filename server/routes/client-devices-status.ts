import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';
import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';
import { IStartClientDeviceResult } from '../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceResult } from '../../shared/interfaces/stop-client-device-result';
import { Bill } from '../utils/bill';
import { Time } from '../utils/time';
import { DeviceStatus } from '../utils/device-status';

import { IStopClientDeviceData } from '../storage/stop-client-device-data';
import { IStartClientDeviceData } from '../storage/start-client-device-data';

export class ClientDevicesStatusRoutes extends RoutesBase {

    private bill = new Bill();
    private time = new Time();
    private deviceStatus = new DeviceStatus();

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    stopDevice(): any {
        return route.post(this.apiPrefix + 'client-devices-status/:id/stop', async ctx => {
            await this.handleActionResult(ctx, () => this.stopDeviceImpl(ctx.request.body));
        });
    }

    startDevice(): any {
        return route.post(this.apiPrefix + 'client-devices-status/:id/start', async ctx => {
            await this.handleActionResult(ctx, () => this.startDeviceImpl(ctx.request.body));
        });
    }

    getClientDevicesStatus(): any {
        return route.get(this.apiPrefix + 'client-devices-status', async ctx => {
            await this.handleActionResult(ctx, () => this.getClientDevicesStatusImpl());
        });
    }

    private async stopDeviceImpl(args: IStartClientDeviceArgs): Promise<IRouteActionResult<IStopClientDeviceResult> | void> {
        const currentStatus = await this.storageProvider.getClientDeviceStatus(args.deviceId);
        const bill = this.bill.calcBill({
            startedAt: currentStatus.startedAt,
            startedAtUptime: currentStatus.startedAtUptime,
            pricePerHour: currentStatus.pricePerHour
        }
        );
        const data = <IStopClientDeviceData>{
            args: args,
            lastBill: bill.totalBill,
            stoppedAt: this.time.getCurrentTime(),
            stoppedAtUptime: this.time.getCurrentUptime()
        };
        const result = await this.storageProvider.stopClientDevice(data);
        return { value: result };
    }

    private async startDeviceImpl(args: IStartClientDeviceArgs): Promise<IRouteActionResult<IStartClientDeviceResult> | void> {
        const data = <IStartClientDeviceData>{
            args: args,
            startedAt: this.time.getCurrentTime(),
            startedAtUptime: this.time.getCurrentUptime()
        };
        const result = await this.storageProvider.startClientDevice(data);
        return { value: result };
    }

    private async getClientDevicesStatusImpl(): Promise<IRouteActionResult<IClientDeviceStatus[]> | void> {
        const status = await this.storageProvider.getClientDevicesStatus();
        this.deviceStatus.setDevicesStatusBill(status);
        return { value: status };
    }
}
