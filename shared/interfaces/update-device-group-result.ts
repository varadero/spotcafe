import { IUpdateEntityResult } from './update-entity-result';

export interface IUpdateDeviceGroupResult extends IUpdateEntityResult {
    invalidPricePerHour: boolean;
}
