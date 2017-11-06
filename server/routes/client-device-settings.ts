import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class ClientDeviceSerttingsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientDeviceSettings(): any {
        return route.get(this.apiPrefix + 'client-device-settings', async ctx => {
            const serverToken = this.getServerToken(ctx);
            await this.handleResult(ctx, () => this.storageProvider.getClientDeviceSettings(serverToken.deviceId));
        });
    }
}
