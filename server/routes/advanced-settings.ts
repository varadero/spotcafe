import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';

export class AdvancedSettingsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getSettings(): any {
        return route.get(this.apiPrefix + 'advanced-settings', async (ctx) => {
            await this.handleResult(ctx, () => this.storageProvider.getSettings(ctx.query.nameSearchText));
        });
    }

    updateSetting(): any {
        return route.post(this.apiPrefix + 'advanced-settings/:id', async (ctx) => {
            await this.handleResult(ctx, () => this.storageProvider.updateSetting(ctx.request.body));
        });
    }
}
