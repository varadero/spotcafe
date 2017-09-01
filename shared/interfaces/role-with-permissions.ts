import { IRole } from './role';
import { IPermission } from './permission';

export interface IRoleWithPermissions {
    role: IRole;
    permissions: IPermission[];
}
