import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
// import { IBaseEntity } from '../../shared/interfaces/base-entity';
import { IApplicationProfileWithFiles } from '../../shared/interfaces/application-profile-with-files';
// import { ICreateEntityResult } from '../../shared/interfaces/create-entity-result';
// import { IUpdateEntityResult } from '../../shared/interfaces/update-entity-result';

export class ApplicationProfilesRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getApplicationProfiles(): any {
        return route.get(this.apiPrefix + 'application-profiles', async ctx => {
            await this.handleActionResult(ctx, () => this.getApplicationGroupsImpl());
        });
    }

    // createApplicationGroup(): any {
    //     return route.post(this.apiPrefix + 'application-groups', async ctx => {
    //         await this.handleActionResult(ctx, () => this.createApplicationGroupImpl(ctx.request.body));
    //     });
    // }

    // updateApplicationGroup(): any {
    //     return route.post(this.apiPrefix + 'application-groups/:id', async ctx => {
    //         await this.handleActionResult(ctx, () => this.updateApplicationGroupImpl(ctx.request.body));
    //     });
    // }

    private async getApplicationGroupsImpl(): Promise<IRouteActionResult<IApplicationProfileWithFiles[]> | void> {
        const result = await this.storageProvider.getApplicationProfiles();
        return { value: result };
    }

    // private async createApplicationGroupImpl(applicationGroup: IBaseEntity): Promise<IRouteActionResult<ICreateEntityResult> | void> {
    //     applicationGroup.name = applicationGroup.name.trim();
    //     if (!applicationGroup.name) {
    //         return { error: { message: 'Name is required', number: 422 } };
    //     }
    //     const result = await this.storageProvider.createApplicationGroup(applicationGroup);
    //     return { value: result };
    // }

    // private async updateApplicationGroupImpl(applicationGroup: IBaseEntity): Promise<IRouteActionResult<IUpdateEntityResult> | void> {
    //     const result = await this.storageProvider.updateApplicationGroup(applicationGroup);
    //     return { value: result };
    // }
}
