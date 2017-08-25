import * as path from 'path';
import * as fs from 'fs';
import { Connection, Request, ColumnValue, TediousType, TYPES, ConnectionConfig } from 'tedious';
import { ICreateDatabaseResult } from '../create-database-result';
import { IPrepareDatabaseResult } from '../prepare-database-result';

export class DatabaseHelper {
    private dbSettingsTableName = 'DatabaseSettings';

    constructor(private config: ConnectionConfig) { }

    async createDatabase(): Promise<ICreateDatabaseResult> {
        const result = <ICreateDatabaseResult>{};
        if (!this.config.options || !this.config.options.database) {
            return Promise.reject('Database is not specified');
        }

        // Make a clone of configuration and clear the database name since it will not exist
        // Connection to non-existing database will fail
        const conf = JSON.parse(JSON.stringify(this.config));
        if (conf.options) {
            conf.options.database = '';
        }

        const database = this.config.options.database;
        let conn = await this.connect(conf);
        try {
            try {
                const createDatabaseSql = `CREATE DATABASE [${database}]`;
                await this.executeRowCount(conn, createDatabaseSql);
            } catch (err) {
                // Don't fail on error on database creation
                // It could be already created by previous action which failed later (ex. at update phase)
                // Or it could be manually created by administrator
                result.errorOnDatabaseCreation = err;
            }
            // Close current connection that created the database because it cannot be used for transactions
            this.close(conn);
            // Create connection with the original configuration that includes the database name which is now created
            conn = await this.connect(this.config);
            await this.beginTransaction(conn);

            // Check for DatabaseSettings existence
            // If it exists - don't continue since the database already exist and we can't recreate it - it must be udated instead
            const checkDatabaseSettingsTableExistenceSql = `
                SELECT TOP 1 [TABLE_NAME]
                FROM [INFORMATION_SCHEMA].[TABLES]
                WHERE [TABLE_NAME]='${this.dbSettingsTableName}'
            `;
            const checkDatabaseSettingsResult = await this.executeRowCount(conn, checkDatabaseSettingsTableExistenceSql);
            if (checkDatabaseSettingsResult > 0) {
                // Table 'DatabaseSettings' already exist - we can't continue with creation of the table - update must be made instead
                throw new Error(`Can't create database "${database}", because it is not empty. It must be updated instead.`);
            }

            const createDatabaseSettingsTableSql = `
                CREATE TABLE dbo.${this.dbSettingsTableName}
                (
                Name nvarchar(250) NOT NULL,
                Value nvarchar(MAX) NULL
                )  ON [PRIMARY]
                TEXTIMAGE_ON [PRIMARY]

                ALTER TABLE dbo.DatabaseSettings ADD CONSTRAINT
                PK_DatabaseSettings_Name PRIMARY KEY CLUSTERED
                (
                Name
                ) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
            `;
            await this.executeRowCount(conn, createDatabaseSettingsTableSql);

            // Insert minimum DatabaseVersion - every other script must have greater date as database version
            const insertDatabaseVersionRowSql = `
                INSERT INTO [${this.dbSettingsTableName}]
                ([Name], [Value])
                VALUES ('DatabaseVersion', '2017-08-25 12:00:00')
            `;
            await this.executeRowCount(conn, insertDatabaseVersionRowSql);

            // Now after DatabaseSettings table is created and DatabaseVersion is set to "0" (new database) - prepare/update the database
            result.prepareDatabaseResult = await this.prepareDatabaseWithExistingConnection(conn);

            await this.commitTransaction(conn);
        } finally {
            this.close(conn);
        }

        return Promise.resolve(result);
    }

    async prepareDatabase(): Promise<IPrepareDatabaseResult> {
        const conn = await this.connect(this.config);
        let updateFilesProcessed: string[];
        try {
            // Update database in transaction
            await this.beginTransaction(conn);
            updateFilesProcessed = await this.updateDatabase(conn);

            await this.commitTransaction(conn);
        } finally {
            this.close(conn);
        }

        return Promise.resolve(<IPrepareDatabaseResult>{
            database: this.config.options ? this.config.options.database : '',
            server: this.config.server,
            userName: this.config.userName,
            updateScriptFilesProcessed: updateFilesProcessed
        });
    }

    async getDatabaseVersion(conn: Connection): Promise<string> {
        const dbVersionSql = `
            SELECT TOP 1 [Value] FROM [${this.dbSettingsTableName}] WHERE [Name]=@Name
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', type: TYPES.NVarChar, value: 'DatabaseVersion' }
        ];
        const rows = await this.executeScalar(conn, dbVersionSql, params);
        return Promise.resolve(rows ? rows.value : null);
    }

    async updateDatabase(conn: Connection): Promise<string[]> {
        const dbVersion = await this.getDatabaseVersion(conn);
        if (!dbVersion) {
            return Promise.reject(`Can't read database version`);
        }
        const scriptsFolder = path.join(__dirname, './schema/scripts/update');
        const scriptFilesForUpdate = this.getScriptFilesForDatabaseUpdate(dbVersion, scriptsFolder);
        await this.checkScriptFilesForUpdate(scriptsFolder, scriptFilesForUpdate);

        // Apply updates
        for (let i = 0; i < scriptFilesForUpdate.length; i++) {
            const scriptFileForUpdate = scriptFilesForUpdate[i];
            const scriptFilePath = path.join(scriptsFolder, scriptFileForUpdate.fileName);
            const fileContent = this.readTextFileSync(scriptFilePath);
            try {
                await this.executeRowCount(conn, fileContent);
            } catch (err) {
                return Promise.reject(`${err}. Error while executing ${scriptFileForUpdate.fileName}`);
            }
        }
        return Promise.resolve(scriptFilesForUpdate.map(x => x.fileName));
    }

    async execute(
        conn: Connection,
        sql: string,
        inputParameters?: IRequestParameter[],
        outputParameters?: IRequestParameter[]
    ): Promise<ColumnValue[][]> {
        return new Promise<ColumnValue[][]>((resolve, reject) => {
            const rows: ColumnValue[][] = [];
            const req = new Request(sql, (err, rowCount) => {
                if (err) { return reject(err); }
                return resolve(rows);
            });
            this.addRequestParameters(req, inputParameters);
            req.on('row', (columns: ColumnValue[]) => {
                rows.push(columns);
            });
            conn.execSql(req);
        });
    }

    async executeToObjects(
        conn: Connection,
        sql: string,
        inputParameters?: IRequestParameter[],
        outputParameters?: IRequestParameter[]
    ): Promise<any[]> {
        const executeResult = await this.execute(conn, sql, inputParameters, outputParameters);
        const rows = <any>[];
        for (let i = 0; i < executeResult.length; i++) {
            const currentRow = executeResult[i];
            const rowObj = <any>{};
            for (let j = 0; j < currentRow.length; j++) {
                const currentCol = currentRow[j];
                rowObj[this.pascalize(currentCol.metadata.colName)] = currentCol.value;
            }
            rows.push(rowObj);
        }
        return rows;
    }

    /**
     * Executres sql query for a given connection and returns number of rows affected
     * @param conn Connection
     * @param sql Sql query
     */
    async executeRowCount(conn: Connection, sql: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const req = new Request(sql, (err, rowCount, rows) => {
                if (err) { return reject(err); }
                return resolve(rowCount);
            });
            conn.execSql(req);
        });
    }

    /**
     * Executes sql query for a given connection and returns a single result
     * @param conn {Connection} Connection
     * @param sql {string} Sql query
     */
    async executeScalar(conn: Connection, sql: string, inputParameters?: IRequestParameter[]): Promise<ColumnValue> {
        let colValue: ColumnValue;
        return new Promise<ColumnValue>((resolve, reject) => {
            const req = new Request(sql, (err, rowCount) => {
                if (err) { return reject(err); }
                return resolve(colValue);
            });
            this.addRequestParameters(req, inputParameters);
            req.on('row', (columns: ColumnValue[]) => {
                if (!colValue) {
                    // Get first column value only if not already set
                    colValue = columns[0];
                }
            });
            conn.execSql(req);
        });
    }

    async connect(config?: ConnectionConfig): Promise<Connection> {
        return new Promise<Connection>((resolve, reject) => {
            const conn = new Connection(config || this.config);
            conn.on('connect', err => {
                if (err) { return reject(err); }
                return resolve(conn);
            });
        });
    }

    async beginTransaction(conn: Connection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            conn.beginTransaction(err => {
                if (err) { return reject(err); }
                return resolve();
            });
        });
    }

    async commitTransaction(conn: Connection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            conn.commitTransaction(err => {
                if (err) { return reject(err); }
                return resolve();
            });
        });
    }

    close(conn: Connection): void {
        conn.close();
    }

    private readTextFileSync(file: string): string {
        return fs.readFileSync(file, { encoding: 'utf8' });
    }

    /**
     * Prepares database in the context of existing conection
     * @param conn Connection with started transaction
     */
    private async prepareDatabaseWithExistingConnection(conn: Connection): Promise<IPrepareDatabaseResult> {
        const updateFilesProcessed = await this.updateDatabase(conn);
        return Promise.resolve(<IPrepareDatabaseResult>{
            database: this.config.options ? this.config.options.database : '',
            server: this.config.server,
            userName: this.config.userName,
            updateScriptFilesProcessed: updateFilesProcessed
        });
    }

    private async checkScriptFilesForUpdate(scriptsFolder: string, updateScriptFileInfos: IUpdateScriptFileInfo[]): Promise<any> {
        for (let i = 0; i < updateScriptFileInfos.length; i++) {
            // Load every file and check if it updates the same version
            const scriptFileForUpdate = updateScriptFileInfos[i];
            const scriptFilePath = path.join(scriptsFolder, scriptFileForUpdate.fileName);
            const fileContent = this.readTextFileSync(scriptFilePath);
            // Some line must be equal to expression that updates the database to the same version as file name
            const stringToMatch = `UPDATE DatabaseSettings SET Value='${scriptFileForUpdate.version}' WHERE Name='DatabaseVersion'`;
            if (fileContent.indexOf(stringToMatch) === -1) {
                const msg = `Script file ${scriptFileForUpdate.fileName} does't update database to correct version.`
                    + `Expected ${scriptFileForUpdate.version}.`;
                return Promise.reject(msg);
            }
        }
        return Promise.resolve();
    }

    private getScriptFilesForDatabaseUpdate(currentDatabaseVersion: string, scriptsFolder: string): IUpdateScriptFileInfo[] {
        const allScriptFiles = fs.readdirSync(scriptsFolder);
        const allVersionFiles = allScriptFiles.filter(x => x.endsWith('.sql'));

        // Get only files with names which match '????-??-??-??-??-??.sql'
        const matchedFiles = allVersionFiles.map(x => x.match(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.sql$/));
        // Kepp only non-null results from .match
        const nonNullMatches = matchedFiles.filter(x => x);
        // Get only file name and version
        const projectedMatches = nonNullMatches.map(x => (<IUpdateScriptFileInfo>{
            fileName: (<RegExpMatchArray>x)[0],
            version: (<RegExpMatchArray>x)[0].substr(0, 19)
        }));
        // Convert all version to valid date/time strings from '????-??-??-??-??-??' to '????-??-?? ??:??:??'
        for (let i = 0; i < projectedMatches.length; i++) {
            const projectedMatch = projectedMatches[i];
            let modifiedVersion = this.setCharAt(projectedMatch.version, 10, ' ');
            modifiedVersion = this.setCharAt(modifiedVersion, 13, ':');
            modifiedVersion = this.setCharAt(modifiedVersion, 16, ':');
            projectedMatch.version = modifiedVersion;
        }
        // Keep only files with version greater than current database version
        const matchesWithGreaterVersions = projectedMatches.filter(x => x.version > currentDatabaseVersion);
        // Sort all files by version a number
        const sortedMatches = matchesWithGreaterVersions.sort((x, y) => x.version.localeCompare(y.version));
        return sortedMatches;
    }

    private setCharAt(str: string, index: number, chr: string): string {
        if (index > str.length - 1) { return str; }
        return str.substr(0, index) + chr + str.substr(index + 1);
    }

    private addRequestParameters(req: Request, inputParameters?: IRequestParameter[]) {
        if (inputParameters) {
            inputParameters.forEach(x => req.addParameter(x.name, x.type, x.value));
        }
    }

    private pascalize(value: string): string {
        return value[0].toLowerCase() + value.substr(1);
    }
}

export interface IRequestParameter {
    name: string;
    type: TediousType;
    value: any;
}

export interface IUpdateScriptFileInfo {
    fileName: string;
    version: string;
}
