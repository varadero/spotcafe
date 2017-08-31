import { IRole } from './role';
import { IPermission } from './permission';

export interface IRoleWithPermisions {
    role: IRole;
    permissions: IPermission[];
}
