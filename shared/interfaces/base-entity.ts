import { IIdWithName } from './id-with-name';

export interface IBaseEntity extends IIdWithName {
    description: string;
}
