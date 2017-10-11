import { IClientGroup } from './client-group';

export interface IClientGroupWithDevicesGroupsIds {
    clientGroup: IClientGroup;
    devicesGroupsIds: string[];
}
