import * as route from 'koa-route';

import { StorageProvider } from '../storage/storage-provider';
import { RoutesBase } from './routes-base';
import { IRouteActionResult } from './interfaces/route-action-result';
import { IDeviceGroup } from '../../shared/interfaces/device-group';
import { Numbers } from '../../shared/numbers';
import { IUpdateDeviceGroupResult } from '../../shared/interfaces/update-device-group-result';
import { ICreateDeviceGroupResult } from '../../shared/interfaces/create-device-group-result';

export class DevicesGroupsRoutes extends RoutesBase {

    private numbers: Numbers;

    constructor(private storageProvider: StorageProvider, private apiPrefix: string) {
        super();
        this.numbers = new Numbers();
    }

    getAllDevicesGroups(): any {
        return route.get(this.apiPrefix + 'devices-groups', async ctx => {
            await this.handleResult(ctx, () => this.storageProvider.getDevicesGroups());
        });
    }

    updateDeviceGroup(): any {
        return route.post(this.apiPrefix + 'devices-groups/:id', async ctx => {
            await this.handleActionResult(ctx, () => this.updateDeviceGroupImp(ctx.request.body));
        });
    }

    createDeviceGroup(): any {
        return route.post(this.apiPrefix + 'devices-groups', async ctx => {
            await this.handleActionResult(ctx, () => this.createDeviceGroupImp(ctx.request.body));
        });
    }

    private async updateDeviceGroupImp(
        deviceGroup: IDeviceGroup
    ): Promise<IRouteActionResult<IUpdateDeviceGroupResult> | void> {
        const sanitizeError = this.sanitizeDeviceGroup(deviceGroup);
        if (sanitizeError) {
            return <IRouteActionResult<ICreateDeviceGroupResult>>sanitizeError;
        }
        const updateResult = await this.storageProvider.updateDeviceGroup(deviceGroup);
        return { value: updateResult };
    }

    private async createDeviceGroupImp(
        deviceGroup: IDeviceGroup
    ): Promise<IRouteActionResult<ICreateDeviceGroupResult> | void> {
        const sanitizeError = this.sanitizeDeviceGroup(deviceGroup);
        if (sanitizeError) {
            return <IRouteActionResult<ICreateDeviceGroupResult>>sanitizeError;
        }
        const createReslt = await this.storageProvider.createDeviceGroup(deviceGroup);
        return { value: createReslt };
    }

    private sanitizeDeviceGroup(deviceGroup: IDeviceGroup): IRouteActionResult<void> | null {
        const trimmedName = this.getTrimmedValue(deviceGroup.name);
        if (!trimmedName) {
            return { error: { message: 'Name is required', number: 422 } };
        }
        if (!deviceGroup.applicationProfileId) {
            return { error: { message: 'Application profile is required', number: 422 } };
        }
        const pricePerHour = this.numbers.stringToNumber(deviceGroup.pricePerHour.toString());
        if (isNaN(pricePerHour)) {
            return { error: { message: 'Price per hour is not a valid number', number: 422 } };
        }
        deviceGroup.pricePerHour = pricePerHour;
        deviceGroup.name = trimmedName;
        return null;
    }

    private getTrimmedValue(value: string): string {
        return (value) ? value.trim() : '';
    }
}
