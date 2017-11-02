import { IBaseEntity } from './base-entity';
import { IApplicationProfileFile } from './application-profile-file';

export interface IApplicationProfileWithFiles {
    profile: IBaseEntity;
    files: IApplicationProfileFile[];
}
