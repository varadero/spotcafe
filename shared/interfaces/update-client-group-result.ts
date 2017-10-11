import { IUpdateEntityResult } from './update-entity-result';

export interface IUpdateClientGroupResult extends IUpdateEntityResult {
    invalidPricePerHour: boolean;
}
