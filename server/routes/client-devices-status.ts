import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceStatus } from '../../shared/interfaces/client-device-status';

export class ClientDevicesStatusRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientDevicesStatus(): any {
        return route.get(this.apiPrefix + 'client-devices-status', async ctx => {
            await this.handleActionResult(ctx, () => this.getClientDevicesStatusImpl());
        });
    }

    private async getClientDevicesStatusImpl(): Promise<IRouteActionResult<IClientDeviceStatus[]> | void> {
        const status = await this.storageProvider.getClientDevicesStatus();
        return { value: status };
    }
}
