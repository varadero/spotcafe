import { IPrepareDatabaseResult } from './prepare-database-result';

export interface ICreateDatabaseResult {
    errorOnDatabaseCreation: any;
    databaseInitialized: boolean;
    prepareDatabaseResult: IPrepareDatabaseResult;
}
