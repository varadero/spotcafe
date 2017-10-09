import { IUpdateEntityResult } from './update-entity-resut';

export interface IUpdateClientGroupResult extends IUpdateEntityResult {
    invalidPricePerHour: boolean;
}
