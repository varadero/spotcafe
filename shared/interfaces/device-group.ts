import { IIdWithName } from './id-with-name';

export interface IDeviceGroup extends IIdWithName {
    description: string;
    pricePerHour: number;
}
