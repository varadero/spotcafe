import { IClient } from '../../../../../shared/interfaces/client';
import { IClientGroup } from '../../../../../shared/interfaces/client-group';

export interface IClientDisplay {
    client: IClient;
    groups: IClientGroup[];
    selectedGroup: IClientGroup;
    confirmPassword: string;
}
