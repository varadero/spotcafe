import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IApplicationProfileWithFiles } from '../../shared/interfaces/application-profile-with-files';
import { IBaseEntity } from '../../shared/interfaces/base-entity';
import { ICreateEntityResult } from '../../shared/interfaces/create-entity-result';
import { IUpdateEntityResult } from '../../shared/interfaces/update-entity-result';

export class ApplicationProfilesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getApplicationProfiles(): any {
        return route.get(this.apiPrefix + 'application-profiles', async ctx => {
            await this.handleActionResult(ctx, () => this.getApplicationProfilesImpl());
        });
    }

    createApplicationProfile(): any {
        return route.post(this.apiPrefix + 'application-profiles', async ctx => {
            await this.handleActionResult(ctx, () => this.createApplicationProfileImpl(ctx.request.body));
        });
    }

    updateApplicationProfile(): any {
        return route.post(this.apiPrefix + 'application-profiles/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateApplicationProfileImpl(ctx.request.body));
        });
    }

    private async getApplicationProfilesImpl(): Promise<IRouteActionResult<IApplicationProfileWithFiles[]>> {
        const result = await this.storageProvider.getApplicationProfiles();
        return { value: result };
    }

    private async createApplicationProfileImpl(profile: IBaseEntity): Promise<IRouteActionResult<ICreateEntityResult>> {
        profile.name = profile.name.trim();
        if (!profile.name) {
            return { error: { message: 'Name is required', number: 422 } };
        }
        const result = await this.storageProvider.createApplicationProfile(profile);
        return { value: result };
    }

    private async updateApplicationProfileImpl(profile: IBaseEntity): Promise<IRouteActionResult<IUpdateEntityResult>> {
        profile.name = profile.name.trim();
        if (!profile.name) {
            return { error: { message: 'Name is required', number: 422 } };
        }
        const result = await this.storageProvider.updateApplicationProfile(profile);
        return { value: result };
    }
}
