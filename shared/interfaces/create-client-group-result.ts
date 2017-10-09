import { ICreateEntityResult } from './create-entity-result';

export interface ICreateClientGroupResult extends ICreateEntityResult {
    invalidPricePerHour: boolean;
}
