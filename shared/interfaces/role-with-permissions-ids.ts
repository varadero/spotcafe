import { IRole } from './role';

export interface IRoleWithPermissionsIds {
    role: IRole;
    permissionsIds: string[];
}
