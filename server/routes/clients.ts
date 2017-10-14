import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IClient } from '../../shared/interfaces/client';
import { ICreateEntityResult } from '../../shared/interfaces/create-entity-result';
import { IRouteActionResult } from './interfaces/route-action-result';
// import { IUpdateEntityResult } from '../../shared/interfaces/update-entity-result';

export class ClientsRoutes extends RoutesBase {

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
    }

    getAllClients(): any {
        return route.get(this.apiPrefix + 'clients', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClients());
        });
    }

    createClient(): any {
        return route.post(this.apiPrefix + 'clients', async ctx => {
            await this.handleActionResult(ctx, () => this.createClientImpl(ctx.request.body));
        });
    }

    updateClient(): any {
        return route.post(this.apiPrefix + 'clients/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateClientImpl(ctx.request.body));
        });
    }

    private async updateClientImpl(
        client: IClient
    ): Promise<IRouteActionResult<boolean> | void> {
        const updateClientResult = await this.storageProvider.updateClient(client);
        return { value: updateClientResult };
    }

    private async createClientImpl(
        client: IClient
    ): Promise<IRouteActionResult<ICreateEntityResult> | void> {
        if (client.password.length < 6) {
            return { error: { message: 'Password length must be at least 6 characters', number: 422 } };
        }
        client.username = client.username.trim();
        if (!client.username) {
            return { error: { message: 'User name is required', number: 422 } };
        }
        const createdClientResult = await this.storageProvider.createClient(client);
        return { value: createdClientResult };
    }
}
