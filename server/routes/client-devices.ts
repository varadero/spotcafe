import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IClientDevice } from '../../shared/interfaces/client-device';

export class ClientDevicesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    updateClientDevice(): any {
        return route.post(this.apiPrefix + 'client-devices/:id', async ctx => {
            await this.handleResult(ctx, () => this.updateClientDeviceImpl(ctx.request.body));
        });
    }

    getClientDevices(): any {
        return route.get(this.apiPrefix + 'client-devices', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClientDevices());
        });
    }

    private async updateClientDeviceImpl(clientDevice: IClientDevice): Promise<void> {
        if (clientDevice.approved && !clientDevice.approvedAt) {
            clientDevice.approvedAt = Date.now();
        }
        await this.storageProvider.updateClientDevice(clientDevice);
    }
}
