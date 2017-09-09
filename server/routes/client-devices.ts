import * as route from 'koa-route';

import { DatabaseProvider } from '../database-provider/database-provider';
import { RoutesBase } from './routes-base';

export class ClientDevicesRoutes extends RoutesBase {

    constructor(private dataProvider: DatabaseProvider, private apiPrefix: string) {
        super();
    }

    updateClientDevice(): any {
        return route.post(this.apiPrefix + 'client-devices/:id', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.updateClientDevice(ctx.request.body));
        });
    }

    approveClientDevice(): any {
        return route.post(this.apiPrefix + 'client-devices/:id/approve', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.approveClientDevice(ctx.request.body));
        });
    }

    getClientDevices(): any {
        return route.get(this.apiPrefix + 'client-devices', async ctx => {
            await this.handleResult(ctx, () => this.dataProvider.getClientDevices());
        });
    }
}
