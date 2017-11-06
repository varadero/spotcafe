import { IClientApplicationFile } from './client-application-file';

export interface IPostStartData {
    clientApplicationFiles: IClientApplicationFile[];
    restartAfterIdleFor: number;
    shutdownAfterIdleFor: number;
}
