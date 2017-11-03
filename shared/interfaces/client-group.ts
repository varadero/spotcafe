import { IIdWithName } from './id-with-name';

export interface IClientGroup extends IIdWithName {
    description: string;
    pricePerHour: number;
    applicationProfileId: string;
}
