import { IClient } from '../../../../../shared/interfaces/client';
import { IClientGroupWithDevicesGroupsIds } from '../../../../../shared/interfaces/client-group-with-devices-groups-ids';

export interface IClientDisplay {
    client: IClient;
    groups: IClientGroupWithDevicesGroupsIds[];
    selectedGroup: IClientGroupWithDevicesGroupsIds;
    confirmPassword: string;
}
