import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientDeviceCurrentData } from './interfaces/client-device-current-data';
import { IPostStartData } from './interfaces/post-start-data';
import { calcEngine } from '../utils/calc-engine';

export class ClientDeviceCurrentDataRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getClientDeviceCurrentData(): any {
        return route.get(this.apiPrefix + 'client-device-current-data', async ctx => {
            const serverToken = this.getServerToken(ctx);
            await this.handleActionResult(ctx, () => this.getClientDeviceCurrentDataImpl(serverToken.deviceId, serverToken.accountId));
        });
    }

    getClientDevicePostStartData(): any {
        return route.get(this.apiPrefix + 'client-device-current-data/post-start', async ctx => {
            const serverToken = this.getServerToken(ctx);
            await this.handleActionResult(ctx, () => this.getClientDevicePostStartDataImpl(serverToken.deviceId, serverToken.accountId));
        });
    }

    private async getClientDevicePostStartDataImpl(
        clientDeviceId: string,
        accountId: string
    ): Promise<IRouteActionResult<IPostStartData> | void> {
        if (!clientDeviceId) {
            return Promise.reject(<IRouteActionResult<void>>{ status: 404 });
        }
        if (accountId) { }
        const result = await this.storageProvider.getClientDevicePostStartData(clientDeviceId);
        return { value: result };
    }

    private async getClientDeviceCurrentDataImpl(
        clientDeviceId: string,
        accountId: string
    ): Promise<IRouteActionResult<IClientDeviceCurrentData> | void> {
        if (!clientDeviceId) {
            return Promise.reject(<IRouteActionResult<void>>{ status: 404 });
        }
        if (accountId) { }

        // Simply get last calculated data from calcEngine
        const lastCalcData = calcEngine.getLastCalcDataForDеvice(clientDeviceId);
        const result: IClientDeviceCurrentData = {
            isStarted: !!lastCalcData
        };
        return { value: result };
        // const status = await this.storageProvider.getClientDeviceStatus(clientDeviceId);
        // const result: IClientDeviceCurrentData = {
        //     isStarted: status.isStarted
        // };
        // return { value: result };
    }
}
