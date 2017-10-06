import { IUpdateEntityResult } from './update-entity-resut';

export interface IUpdateDeviceGroupResult extends IUpdateEntityResult {
    invalidPricePerHour: boolean;
}
