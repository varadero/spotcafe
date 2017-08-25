import { ICreateDatabaseResult } from './create-database-result';
import { IPrepareDatabaseResult } from './prepare-database-result';

export abstract class DatabaseProvider {
    abstract initialize(obj: any): void;
    abstract createDatabase(): Promise<ICreateDatabaseResult>;
    abstract prepareDatabase(): Promise<IPrepareDatabaseResult>;
}
