import {
    ConnectionConfig,
} from 'tedious';
import { DatabaseProvider } from '../database-provider';
import { IPrepareDatabaseResult } from '../prepare-database-result';
import { ICreateDatabaseResult } from '../create-database-result';
import { DatabaseHelper } from './database-helper';

export class MSSqlDatabaseProvider implements DatabaseProvider {
    private config: ConnectionConfig;
    private dbHelper: DatabaseHelper;

    initialize(obj: any): void {
        this.config = <ConnectionConfig>(obj);
        this.dbHelper = new DatabaseHelper(this.config);
    }

    async createDatabase(): Promise<ICreateDatabaseResult> {
        return this.dbHelper.createDatabase();
    }

    async prepareDatabase(): Promise<IPrepareDatabaseResult> {
        return this.dbHelper.prepareDatabase();
    }
}
