import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceCurrentData } from './interfaces/client-device-current-data';
// import { IPostStartData } from './interfaces/post-start-data';

export class ClientDeviceCurrentDataRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientDeviceCurrentData(): any {
        return route.get(this.apiPrefix + 'client-device-current-data', async ctx => {
            await this.handleActionResult(ctx, () => this.getClientDeviceCurrentDataImpl(this.getServerToken(ctx).accountId));
        });
    }

    // getClientDevicePostStartData(): any {
    //     return route.get(this.apiPrefix + 'client-device-current-data/post-start', async ctx => {
    //         await this.handleActionResult(ctx, () => this.getClientDevicePostStartDataImpl(this.getServerToken(ctx).accountId));
    //     });
    // }

    // private async getClientDevicePostStartDataImpl(clientDeviceId: string): Promise<IRouteActionResult<IPostStartData> | void> {
    //     const result = 6;
    //     return { value: result };
    // }

    private async getClientDeviceCurrentDataImpl(
        clientDeviceId: string
    ): Promise<IRouteActionResult<IClientDeviceCurrentData> | void> {
        if (!clientDeviceId) {
            return Promise.reject(<IRouteActionResult<void>>{ status: 404 });
        }
        // TODO Simply get last calculated data from calcEngine
        const status = await this.storageProvider.getClientDeviceStatus(clientDeviceId);
        const result: IClientDeviceCurrentData = {
            isStarted: status.isStarted
        };
        return { value: result };
    }
}
