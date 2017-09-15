import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class ClientDevicesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    updateClientDevice(): any {
        return route.post(this.apiPrefix + 'client-devices/:id', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.updateClientDevice(ctx.request.body));
        });
    }

    approveClientDevice(): any {
        return route.post(this.apiPrefix + 'client-devices/:id/approve', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.approveClientDevice(ctx.request.body));
        });
    }

    getClientDevices(): any {
        return route.get(this.apiPrefix + 'client-devices', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClientDevices());
        });
    }
}
