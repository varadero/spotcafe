import { IPrepareStorageResult } from './prepare-storage-result';

export interface ICreateStorageResult {
    errorOnStorageCreation: any;
    storageInitialized: boolean;
    prepareStorageResult: IPrepareStorageResult;
}
