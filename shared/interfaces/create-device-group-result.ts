import { ICreateEntityResult } from './create-entity-result';

export interface ICreateDeviceGroupResult extends ICreateEntityResult {
    invalidPricePerHour: boolean;
}
