import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as uuidv4 from 'uuid/v4';

import { Connection, Request, ColumnValue, TediousType, TYPES, ConnectionConfig } from 'tedious';
import { ICreateStorageResult } from '../create-storage-result';
import { IPrepareStorageResult } from '../prepare-storage-result';
import { ConnectionPool, IConnectionPoolConfig } from './connection-pool';

export class DatabaseHelper {
    private constants = {
        settingsTableName: 'Settings',
        databaseVersionSettingName: 'database.version',
        administratorId: 'AD0CA48F-E266-48EA-BFB7-0C03147E442C'
    };

    private connectionPool: ConnectionPool;

    constructor(private config: ConnectionConfig, private logger: { log: Function, error: Function }) {
        // TODO Get connection pool config from database or from config parameter
        this.connectionPool = this.createConnectionPool({ maxConnections: 100, idleTimeout: 60000, timeToLive: 120000 }, logger);
    }

    async getTokenSecret(): Promise<string | null> {
        const conn = await this.connect();
        try {
            return await this.getDatabaseSetting(conn, 'token.secret');
        } finally {
            this.close(conn);
        }
    }

    async createDatabase(appAdministratorPassword: string): Promise<ICreateStorageResult> {
        const result = <ICreateStorageResult>{};
        if (!this.config.options || !this.config.options.database) {
            const errMsg = 'Database is not specified';
            this.logError(errMsg);
            this.connectionPool.dispose();
            return Promise.reject(errMsg);
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
                await this.createNewDatabase(conn, database);
            } catch (err) {
                // Don't fail on error on database creation
                // It could be already created by previous action which failed later (ex. at update phase)
                // Or it could be manually created by administrator
                this.logInfo('Will not create database');
                result.errorOnStorageCreation = err;
            }
            // Close current connection that created the database because it cannot be used for transactions
            this.close(conn);
            // Dispose current connection pool and create new one
            this.connectionPool.dispose();
            this.connectionPool = this.createConnectionPool({ maxConnections: 100, idleTimeout: 60000, timeToLive: 120000 }, this.logger);
            // Create connection with the original configuration that includes the database name which is now created
            conn = await this.connect(this.config);
            await this.beginTransaction(conn);

            // Check for Settings table existence
            // If it exists - don't continue since the database already exist and we can't recreate it - it must be udated instead
            const checkSettingsResult = await this.checkSettingsTableExistence(conn);
            if (checkSettingsResult) {
                // Table 'Settings' already exist - we can't continue with creation of the table
                throw new Error(`Can't create database "${database}", because it is not empty.`);
            }

            await this.createSettingsTable(conn);
            await this.insertDatabaseVersion(conn, '2017-08-25 12:00:00');
            await this.insertTokenSecret(conn, this.getSqlSanitizedRandomString(30));
            await this.prepareDatabaseWithExistingConnection(conn);
            await this.setEmployeePassword(conn, this.constants.administratorId, appAdministratorPassword);
            await this.commitTransaction(conn);
            this.close(conn);
            result.storageInitialized = true;
        } catch (err) {
            result.errorOnStorageCreation = err;
            this.logger.error(err);
        } finally {
            this.connectionPool.dispose();
        }

        return Promise.resolve(result);
    }

    async prepareDatabase(appAdministratorPassword: string): Promise<IPrepareStorageResult> {
        // This should not use connection pooling
        // Every time new connection must be created, otherwise a single connection could be used
        // And in case of an error, some of the statements could be already executed
        // Database version changed and next executions (repetitions because of errors) could read
        // Changed data before the error. The goal is everything in the database to be rolled back
        // In case this function is reexecuted

        let conn: Connection | null = null;
        let updateFilesProcessed: string[];
        try {
            // Update database in transaction
            conn = await this.connectNoCache(this.config);
            await this.beginTransaction(conn);
            const settingsTableExists = await this.checkSettingsTableExistence(conn);
            if (!settingsTableExists) {
                if (!appAdministratorPassword) {
                    return Promise.reject('Database is empty - provide app administrator password');
                }
                // This is update after the database was created manually
                // Such database doesn't have Settings table -we should create it
                await this.createSettingsTable(conn);
                await this.insertDatabaseVersion(conn, '2017-08-25 12:00:00');
                await this.insertTokenSecret(conn, this.getSqlSanitizedRandomString(30));
            }
            updateFilesProcessed = await this.updateDatabase(conn);
            if (!settingsTableExists) {
                // Settings table was just created which means the database was empty
                // Set employee passsword
                await this.setEmployeePassword(conn, this.constants.administratorId, appAdministratorPassword);
            }
            await this.commitTransaction(conn);
        } finally {
            if (conn) {
                conn.close();
            }
            this.connectionPool.dispose();
        }

        return Promise.resolve(<IPrepareStorageResult>{
            storage: this.config.options ? this.config.options.database : '',
            server: this.config.server,
            userName: this.config.userName,
            updateScriptFilesProcessed: updateFilesProcessed
        });
    }

    async getDatabaseVersion(conn: Connection): Promise<string | null> {
        return await this.getDatabaseSetting(conn, this.constants.databaseVersionSettingName);
    }

    async getDatabaseSetting(conn: Connection | null, settingName: string): Promise<string | null> {
        const sql = `
            SELECT TOP 1 [Value]
            FROM [${this.constants.settingsTableName}]
            WHERE [Name]=@Name
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', value: settingName, type: TYPES.NVarChar }
        ];
        const scalarResult = await this.executeScalar(conn, sql, params);
        if (scalarResult) {
            return Promise.resolve(scalarResult.value);
        }
        return Promise.resolve(null);
    }

    async updateDatabase(conn: Connection): Promise<string[]> {
        let errMsg: string;
        const dbVersion = await this.getDatabaseVersion(conn);
        if (!dbVersion) {
            errMsg = `Can't read database version`;
            this.logError(errMsg);
            return Promise.reject(errMsg);
        }
        const scriptsFolder = path.join(__dirname, './schema/scripts/update');
        const scriptFilesForUpdate = this.getScriptFilesForDatabaseUpdate(dbVersion, scriptsFolder);
        await this.checkScriptFilesForUpdate(scriptsFolder, scriptFilesForUpdate);

        // Apply updates
        for (const scriptFileForUpdate of scriptFilesForUpdate) {
            const scriptFilePath = path.join(scriptsFolder, scriptFileForUpdate.fileName);
            const fileContent = this.readTextFileSync(scriptFilePath);
            const goParts = fileContent.split(/^GO\s+$/gm);
            for (const goPart of goParts) {
                try {
                    await this.executeRowCount(conn, goPart);
                } catch (err) {
                    errMsg = `${err}. Error while executing ${scriptFileForUpdate.fileName} ${goParts.length > 1 ? goPart : ''}`;
                    this.logError(errMsg);
                    return Promise.reject(errMsg);
                }
            }
        }
        return scriptFilesForUpdate.map(x => x.fileName);
    }

    // async execute(
    //     conn: Connection,
    //     sql: string,
    //     inputParameters?: IRequestParameter[],
    //     outputParameters?: IRequestParameter[]
    // ): Promise<ColumnValue[][]> {
    //     return new Promise<ColumnValue[][]>((resolve, reject) => {
    //         const rows: ColumnValue[][] = [];
    //         const req = new Request(sql, (err, rowCount) => {
    //             if (err) { return reject(err); }
    //             return resolve(rows);
    //         });
    //         this.addRequestParameters(req, inputParameters);
    //         req.on('columnMetadata', (columns: ColumnValue[]) => {
    //             // Happens when result set is started
    //         });
    //         req.on('row', (columns: ColumnValue[]) => {
    //             rows.push(columns);
    //         });
    //         req.on('done', (rowCount, more: boolean, doneRows) => {
    //             // Happens when all 'row' events for the result set were fired
    //         });
    //         conn.execSql(req);
    //     });
    // }

    async execute(
        conn: Connection,
        sql: string,
        inputParameters?: IRequestParameter[]
    ): Promise<IExecuteResult> {
        return new Promise<IExecuteResult>((resolve, reject) => {
            const result = <IExecuteResult>{};
            result.firstResultSet = <IResultSet>{ rows: [] };
            result.allResultSets = [];
            let rows: ColumnValue[][] = [];
            const req = new Request(sql, err => {
                if (err) {
                    this.logError(err, sql);
                    return reject(err);
                }
                if (rows.length > 0) {
                    // Add rows of a single result set
                    // Because 'done' event will not be fired for single result sets and allResultSets is empty
                    result.allResultSets.push(<IResultSet>{ rows: rows });
                }
                if (result.allResultSets.length > 0) {
                    result.firstResultSet = result.allResultSets[0];
                }
                return resolve(result);
            });
            this.addRequestParameters(req, inputParameters);
            req.on('columnMetadata', () => {
                // Happens before each resultset 'row' events
                if (rows.length > 0) {
                    result.allResultSets.push(<IResultSet>{ rows: rows });
                    rows = [];
                }
            });
            req.on('row', (columns: ColumnValue[]) => {
                rows.push(columns);
            });
            conn.execSql(req);
        });
    }

    async executeToObjects(
        conn: Connection | null,
        sql: string,
        inputParameters?: IRequestParameter[]
    ): Promise<IExecuteToObjectsResult> {
        const connection = await this.getConnection(conn);
        const executeResult = await this.execute(connection, sql, inputParameters);
        if (!conn) {
            // The connection was not sent as parameter - it was created locally - close it
            this.close(connection);
        }
        const result = <IExecuteToObjectsResult>{};
        result.allResultSets = [];
        if (executeResult.allResultSets.length > 0) {
            for (let rsi = 0; rsi < executeResult.allResultSets.length; rsi++) {
                const rs = executeResult.allResultSets[rsi];
                if (rs.rows) {
                    const rows = <any>[];
                    // Convert each row of each result set into an object
                    for (let i = 0; i < rs.rows.length; i++) {
                        const currentRow = rs.rows[i];
                        const rowObj = <any>{};
                        for (let j = 0; j < currentRow.length; j++) {
                            const currentCol = currentRow[j];
                            rowObj[this.pascalize(currentCol.metadata.colName)] = currentCol.value;
                        }
                        rows.push(rowObj);
                    }
                    result.allResultSets.push(<IObjectsResultSet>{ rows: rows });
                }
            }
        }
        result.firstResultSet = result.allResultSets[0] || <IObjectsResultSet>{ rows: [] };
        return result;
    }

    execToObjects(
        sql: string,
        inputParameters?: IRequestParameter[]
    ): Promise<IExecuteToObjectsResult> {
        return this.executeToObjects(null, sql, inputParameters);
    }

    /**
     * Executes sql query for a given connection and returns number of rows affected
     * @param conn Connection
     * @param sql Sql query
     */
    async executeRowCount(
        conn: Connection | null,
        sql: string,
        inputParameters?: IRequestParameter[]
    ): Promise<number> {
        const connection = await this.getConnection(conn);
        return new Promise<number>((resolve, reject) => {
            const req = new Request(sql, (err, rowCount) => {
                if (!conn) {
                    // The connection was not sent as parameter - it was created locally - close it
                    this.close(connection);
                }
                if (err) {
                    this.logError(err, sql);
                    return reject(err);
                }
                return resolve(rowCount);
            });
            this.addRequestParameters(req, inputParameters);
            connection.execSql(req);
        });
    }

    async execRowCount(
        sql: string,
        inputParameters?: IRequestParameter[]
    ): Promise<number> {
        return this.executeRowCount(null, sql, inputParameters);
    }

    /**
     * Executes sql query for a given connection and returns a single result
     * @param conn {Connection} Connection
     * @param sql {string} Sql query
     */
    async executeScalar(
        conn: Connection | null,
        sql: string, inputParameters?: IRequestParameter[]
    ): Promise<ColumnValue> {
        const connection = await this.getConnection(conn);
        let colValue: ColumnValue;
        return new Promise<ColumnValue>((resolve, reject) => {
            const req = new Request(sql, err => {
                if (!conn) {
                    // The connection was not sent as parameter - it was created locally - close it
                    this.close(connection);
                }
                if (err) {
                    this.logError(err, sql);
                    return reject(err);
                }
                return resolve(colValue);
            });
            this.addRequestParameters(req, inputParameters);
            req.on('row', (columns: ColumnValue[]) => {
                if (!colValue) {
                    // Get first column value only if not already set
                    colValue = columns[0];
                }
            });
            connection.execSql(req);
        });
    }

    async execScalar(sql: string, inputParameters?: IRequestParameter[]): Promise<ColumnValue> {
        return this.executeScalar(null, sql, inputParameters);
    }

    async connect(config?: ConnectionConfig): Promise<Connection> {
        const connection = await this.connectionPool.getConnection(config || this.config);
        if (!connection) {
            const errMsg = 'Connection is not available';
            this.logError(errMsg);
            return Promise.reject(errMsg);
        }
        return connection;
    }

    async connectNoCache(config?: ConnectionConfig): Promise<Connection> {
        return await this.connectionPool.connectNewConnection(config || this.config);
    }

    async beginTransaction(conn: Connection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            conn.beginTransaction(err => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    async commitTransaction(conn: Connection): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            conn.commitTransaction(err => {
                if (err) {
                    this.logError(err);
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    close(conn: Connection): void {
        this.connectionPool.releaseConnection(conn);
    }

    groupAndRename(
        items: any[],
        keyObjectMap: { [key: string]: string },
        itemsObjectMap: { [key: string]: string },
        keyPropertyName: string,
        itemsPropertyName: string
    ) {
        const grouped = this.groupByProperties(items, keyObjectMap, itemsObjectMap);
        const result = this.getGroupsWithChangedProperties(grouped, keyPropertyName, itemsPropertyName);
        return result;
    }

    groupByProperties(
        items: any[],
        keyObjectMap: { [key: string]: string },
        itemsObjectMap: { [key: string]: string }
    ): IGroup[] {
        const result: IGroup[] = [];
        const keyObjectMapPropNames = Object.getOwnPropertyNames(keyObjectMap);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const keyPropsAsObject = this.getPropsAsObject(keyObjectMapPropNames, item);
            const grpKey = this.mapToObject(keyPropsAsObject, keyObjectMap);
            const existingGroup = this.getGroupByKey(grpKey, result);
            const restPropsAsObject = this.getRestPropsAsObject(keyObjectMapPropNames, item);
            const mappedItem = this.mapToObject(restPropsAsObject, itemsObjectMap);
            if (existingGroup) {
                existingGroup.items.push(mappedItem);
            } else {
                const newGroup = <IGroup>{ key: grpKey, items: [mappedItem] };
                result.push(newGroup);
            }
        }
        return result;
    }

    getGroupsWithChangedProperties(groups: IGroup[], keyPropertyName: string, itemsPropertyName: string): any[] {
        const result: any[] = [];
        for (let i = 0; i < groups.length; i++) {
            const grp = groups[i];
            const renamedGrp = {
                [keyPropertyName]: grp.key,
                [itemsPropertyName]: grp.items
            };
            result.push(renamedGrp);
        }
        return result;
    }

    encloseInBeginTryTransactionBlocks(sql: string): string {
        const wrappedSql = `
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
            BEGIN TRY
                BEGIN TRANSACTION
                ${sql}
                COMMIT TRANSACTION
            END TRY
            BEGIN CATCH
                ROLLBACK TRANSACTION
                DECLARE @ErrorMessage NVARCHAR(4000);
                DECLARE @ErrorSeverity INT;
                DECLARE @ErrorState INT;
                SELECT @ErrorMessage = ERROR_MESSAGE(),
                    @ErrorSeverity = ERROR_SEVERITY(),
                    @ErrorState = ERROR_STATE();
                RAISERROR (@ErrorMessage,
                        @ErrorSeverity,
                        @ErrorState);
            END CATCH
        `;
        return wrappedSql;
    }

    generateId(): string {
        return uuidv4().toUpperCase();
    }

    getSha512(value: string): string {
        const sha256 = crypto.createHash('sha512');
        const hash = sha256.update(value).digest('hex');
        return hash;
    }

    /**
     * Maps specified source object to resulting object with possible renaming of properties specified in mapObject
     * @param sourceObject Source object
     * @param mapObject Object containing properties with names from source object
     *  and values for the property names for the destination object. If the value is falsy,
     *  source property will be used as name for the destination property
     * @param mapObjectPropertyNames For performane reasons only - array with property names of mapObject
     */
    mapToObject(
        sourceObject: any,
        mapObject: { [key: string]: string },
        mapObjectPropertyNames?: string[]
    ): any {
        const result: { [key: string]: any } = {};
        const mapObjectPropNames = mapObjectPropertyNames || Object.getOwnPropertyNames(mapObject);
        for (let i = 0; i < mapObjectPropNames.length; i++) {
            const srcPropName = mapObjectPropNames[i];
            const dstPropName = mapObject[srcPropName] || srcPropName;
            result[dstPropName] = sourceObject[srcPropName];
        }
        return result;
    }

    mapToObjects(
        sourceObjects: any[],
        mapObject: { [key: string]: string },
        mapObjectPropertyNames?: string[]
    ): any {
        const result = [];
        for (let i = 0; i < sourceObjects.length; i++) {
            result.push(this.mapToObject(sourceObjects[i], mapObject, mapObjectPropertyNames));
        }
        return result;
    }

    private createConnectionPool(config: IConnectionPoolConfig, logger: { log: Function, error: Function }): ConnectionPool {
        return new ConnectionPool(config, logger);
    }

    private getRestPropsAsObject(excludePropNames: string[], obj: any): any {
        const result = <any>{};
        const allProps = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < allProps.length; i++) {
            const propName = allProps[i];
            if (!excludePropNames.includes(propName)) {
                result[propName] = obj[propName];
            }
        }
        return result;
    }

    private getPropsAsObject(propNames: string[], obj: any): any {
        const result = <any>{};
        for (let i = 0; i < propNames.length; i++) {
            const propName = propNames[i];
            result[propName] = obj[propName];
        }
        return result;
    }

    private getGroupByKey(key: { [key: string]: any }, groups: IGroup[]): IGroup | null {
        const keyPropNames = Object.getOwnPropertyNames(key);
        for (let i = 0; i < groups.length; i++) {
            const groupKey = groups[i].key;
            const equals = keyPropNames.every(propName => groupKey[propName] === key[propName]);
            if (equals) {
                return groups[i];
            }
        }
        return null;
    }

    private async createNewDatabase(conn: Connection, databaseName: string): Promise<number> {
        const createDatabaseSql = `
                CREATE DATABASE [${databaseName}]
        `;
        return await this.executeRowCount(conn, createDatabaseSql);
    }

    private async checkSettingsTableExistence(conn: Connection): Promise<boolean> {
        const checkSettingsTableExistenceSql = `
            SELECT TOP 1 [TABLE_NAME]
            FROM [INFORMATION_SCHEMA].[TABLES]
            WHERE [TABLE_NAME]='${this.constants.settingsTableName}'
        `;
        const checkSettingsResult = await this.executeRowCount(conn, checkSettingsTableExistenceSql);
        return checkSettingsResult > 0;
    }

    private async createSettingsTable(conn: Connection): Promise<number> {
        const createSettingsTableSql = `
            CREATE TABLE dbo.${this.constants.settingsTableName}
            (
            Name nvarchar(250) NOT NULL,
            Value nvarchar(MAX) NULL
            )  ON [PRIMARY]
            TEXTIMAGE_ON [PRIMARY]

            ALTER TABLE dbo.[Settings] ADD CONSTRAINT
            PK_Settings_Name PRIMARY KEY CLUSTERED
            (
            Name
            ) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
        `;
        return await this.executeRowCount(conn, createSettingsTableSql);
    }

    private async insertDatabaseVersion(conn: Connection, databaseVersion: string): Promise<number> {
        // Insert minimum database.version - every other script must have greater date as database version
        const insertDatabaseVersionRowSql = `
            INSERT INTO [${this.constants.settingsTableName}]
            ([Name], [Value]) VALUES
            ('${this.constants.databaseVersionSettingName}', @DatabaseVersion)
        `;
        const params: IRequestParameter[] = [
            { name: 'DatabaseVersion', type: TYPES.NVarChar, value: databaseVersion }
        ];
        return await this.executeRowCount(conn, insertDatabaseVersionRowSql, params);
    }

    private async insertTokenSecret(conn: Connection, tokenSecret: string): Promise<number> {
        // Insert token secret
        const insertTokenSecretRowSql = `
                INSERT INTO [${this.constants.settingsTableName}]
                ([Name], [Value]) VALUES
                ('token.secret', '${tokenSecret}')
            `;
        return await this.executeRowCount(conn, insertTokenSecretRowSql);
    }

    private async setEmployeePassword(conn: Connection, employeeId: string, password: string): Promise<number> {
        const insertAdministratorUserSql = `
            UPDATE [Employees]
            SET [Password]=@Password
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Password', value: this.getSha512(password), type: TYPES.NVarChar },
            { name: 'Id', value: employeeId, type: TYPES.UniqueIdentifier }
        ];
        return await this.executeRowCount(conn, insertAdministratorUserSql, params);
    }

    private readTextFileSync(file: string): string {
        return fs.readFileSync(file, { encoding: 'utf8' });
    }

    /**
     * Prepares database in the context of existing conection
     * @param conn Connection with started transaction
     */
    private async prepareDatabaseWithExistingConnection(conn: Connection): Promise<IPrepareStorageResult> {
        const updateFilesProcessed = await this.updateDatabase(conn);
        return <IPrepareStorageResult>{
            storage: this.config.options ? this.config.options.database : '',
            server: this.config.server,
            userName: this.config.userName,
            updateScriptFilesProcessed: updateFilesProcessed
        };
    }

    private async checkScriptFilesForUpdate(scriptsFolder: string, updateScriptFileInfos: IUpdateScriptFileInfo[]): Promise<any> {
        for (let i = 0; i < updateScriptFileInfos.length; i++) {
            // Load every file and check if it updates the same version
            const scriptFileForUpdate = updateScriptFileInfos[i];
            const scriptFilePath = path.join(scriptsFolder, scriptFileForUpdate.fileName);
            const fileContent = this.readTextFileSync(scriptFilePath);
            // Some line must be equal to expression that updates the database to the same version as file name
            const fileVersion = scriptFileForUpdate.version;
            const databaseVersionSettingName = this.constants.databaseVersionSettingName;
            const settingsTableName = this.constants.settingsTableName;
            const stringToMatch = `UPDATE [${settingsTableName}] SET [Value]='${fileVersion}' WHERE [Name]='${databaseVersionSettingName}'`;
            if (fileContent.indexOf(stringToMatch) === -1) {
                const errMsg = `Script file ${scriptFileForUpdate.fileName} doesn't update database to correct version.`
                    + `Expected ${scriptFileForUpdate.version}.`;
                this.logError(errMsg);
                return Promise.reject(errMsg);
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

    private async getConnection(conn: Connection | null): Promise<Connection> {
        if (conn) { return Promise.resolve(conn); }
        conn = await this.connect(this.config);
        return conn;
    }

    private getRandomString(length: number): string {
        let result = '';
        for (let i = 0; i < length; i++) {
            while (true) {
                const rnd = crypto.randomBytes(1)[0];
                const isOk = (rnd >= 33 && rnd <= 126);
                if (isOk) {
                    result += String.fromCharCode(rnd);
                    break;
                }
            }
        }
        return result;
    }

    private getSqlSanitizedRandomString(length: number): string {
        const randomString = this.getRandomString(length);
        const sanitized = randomString.replace(/'/g, `''`);
        return sanitized;
    }

    private logError(message?: any, ...optionalParams: any[]) {
        if (this.logger) {
            this.logger.error(message, ...optionalParams);
        }
    }

    private logInfo(message?: any, ...optionalParams: any[]) {
        if (this.logger) {
            this.logger.log(message, ...optionalParams);
        }
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

export interface IExecuteToObjectsResult {
    firstResultSet: IObjectsResultSet;
    allResultSets: IObjectsResultSet[];
}

export interface IExecuteResult {
    firstResultSet: IResultSet;
    allResultSets: IResultSet[];
}

export interface IResultSet {
    rows: ColumnValue[][] | null;
}

export interface IObjectsResultSet {
    rows: any[];
}

export interface IGroup {
    key: any;
    items: any[];
}
