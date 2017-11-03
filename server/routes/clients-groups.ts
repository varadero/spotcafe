import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IClientGroupWithDevicesGroupsIds } from '../../shared/interfaces/client-group-with-devices-groups-ids';
import { Numbers } from '../../shared/numbers';
import { IUpdateClientGroupResult } from '../../shared/interfaces/update-client-group-result';
import { ICreateClientGroupResult } from '../../shared/interfaces/create-client-group-result';

export class ClientsGroupsRoutes extends RoutesBase {

    private numbers: Numbers;

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
        this.numbers = new Numbers();
    }

    getAllClientsGroups(): any {
        return route.get(this.apiPrefix + 'clients-groups-with-devices-groups', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getClientsGroupsWithDevicesGroupsIds());
        });
    }

    updateClientGroup(): any {
        return route.post(this.apiPrefix + 'clients-groups-with-devices-groups/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateClientGroupImp(ctx.request.body));
        });
    }

    createClientGroup(): any {
        return route.post(this.apiPrefix + 'clients-groups-with-devices-groups', async ctx => {
            await this.handleActionResult(ctx, () => this.createClientGroupImp(ctx.request.body));
        });
    }

    private async updateClientGroupImp(
        clientGroup: IClientGroupWithDevicesGroupsIds
    ): Promise<IRouteActionResult<IUpdateClientGroupResult> | void> {
        const sanitizeError = this.sanitizeClientGroup(clientGroup);
        if (sanitizeError) {
            return <IRouteActionResult<ICreateClientGroupResult>>sanitizeError;
        }
        const updateResult = await this.storageProvider.updateClientGroupWithDevicesGroupsIds(clientGroup);
        return { value: updateResult };
    }

    private async createClientGroupImp(
        clientGroup: IClientGroupWithDevicesGroupsIds
    ): Promise<IRouteActionResult<ICreateClientGroupResult> | void> {
        const sanitizeError = this.sanitizeClientGroup(clientGroup);
        if (sanitizeError) {
            return <IRouteActionResult<ICreateClientGroupResult>>sanitizeError;
        }
        const createReslt = await this.storageProvider.createClientGroupWithDevicesGroupsIds(clientGroup);
        return { value: createReslt };
    }

    private sanitizeClientGroup(
        clientGroupWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds
    ): IRouteActionResult<void> | null {
        const clientGroup = clientGroupWithDevicesGroupsIds.clientGroup;
        const trimmedName = this.getTrimmedValue(clientGroup.name);
        if (!trimmedName) {
            return { error: { message: 'Name is required', number: 422 } };
        }
        if (!clientGroup.applicationProfileId) {
            return { error: { message: 'Application profile is required', number: 422 } };
        }
        const pricePerHour = this.numbers.stringToNumber(clientGroup.pricePerHour.toString());
        if (isNaN(pricePerHour)) {
            return { error: { message: 'Price per hour is not a valid number', number: 422 } };
        }
        clientGroup.pricePerHour = pricePerHour;
        clientGroup.name = trimmedName;
        return null;
    }

    private getTrimmedValue(value: string): string {
        return (value) ? value.trim() : '';
    }
}
