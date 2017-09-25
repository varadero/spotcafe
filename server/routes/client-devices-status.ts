import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';
import { IStartClientDeviceArgs } from '../../shared/interfaces/start-client-device-args';
import { IStartClientDeviceResult } from '../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceResult } from '../../shared/interfaces/stop-client-device-result';

export class ClientDevicesStatusRoutes extends RoutesBase {

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
        const startedAt = new Date().getTime();
        const result = await this.storageProvider.stopClientDevice(args, startedAt);
        return { value: result };
    }

    private async startDeviceImpl(args: IStartClientDeviceArgs): Promise<IRouteActionResult<IStartClientDeviceResult> | void> {
        const startedAt = new Date().getTime();
        const result = await this.storageProvider.startClientDevice(args, startedAt);
        return { value: result };
    }

    private async getClientDevicesStatusImpl(): Promise<IRouteActionResult<IClientDeviceStatus[]> | void> {
        const status = await this.storageProvider.getClientDevicesStatus();
        return { value: status };
    }
}
