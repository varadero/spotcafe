import { ConnectionConfig, TYPES } from 'tedious';

import { StorageProvider } from '../storage-provider';
import { IPrepareStorageResult } from '../prepare-storage-result';
import { ICreateStorageResult } from '../create-storage-result';
import { DatabaseHelper, IRequestParameter } from './database-helper';
import { IPermission } from '../../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../../shared/interfaces/employee-with-roles-and-permissions';
// import { IRoleWithPermissions } from '../../../shared/interfaces/role-with-permissions';
import { IRole } from '../../../shared/interfaces/role';
import { IEmployeeWithRoles } from '../../../shared/interfaces/employee-with-roles';
import { IEmployee } from '../../../shared/interfaces/employee';
import { IClientDevice } from '../../../shared/interfaces/client-device';
import { ICreateEmployeeResult } from '../../../shared/interfaces/create-employee-result';
import { IRegisterClientDeviceResult } from '../register-client-device-result';
import { IClientFilesData } from '../client-files-data';
import { IRoleWithPermissionsIds } from '../../../shared/interfaces/role-with-permissions-ids';
import { IRoleWithPermissions } from '../../../shared/interfaces/role-with-permissions';
import { ICreateRoleWithPermissionsIdsResult } from '../../../shared/interfaces/create-role-with-permissions-ids-result';
import { IClientDeviceStatus } from '../../../shared/interfaces/client-device-status';
import { IStartClientDeviceResult } from '../../../shared/interfaces/start-client-device-result';
import { IStopClientDeviceResult } from '../../../shared/interfaces/stop-client-device-result';
import { IClientStartupData } from '../client-startup-data';
import { IDeviceGroup } from '../../../shared/interfaces/device-group';
import { ICreateDeviceGroupResult } from '../../../shared/interfaces/create-device-group-result';
import { IUpdateDeviceGroupResult } from '../../../shared/interfaces/update-device-group-result';
import { IStartClientDeviceData } from '../start-client-device-data';
import { IStopClientDeviceData } from '../stop-client-device-data';
import { IClientGroupWithDevicesGroupsIds } from '../../../shared/interfaces/client-group-with-devices-groups-ids';
import { ICreateClientGroupResult } from '../../../shared/interfaces/create-client-group-result';
import { IUpdateClientGroupResult } from '../../../shared/interfaces/update-client-group-result';
import { IClient } from '../../../shared/interfaces/client';
import { ICreateEntityResult } from '../../../shared/interfaces/create-entity-result';
// import { IUpdateEntityResult } from '../../../shared/interfaces/update-entity-result';
import { IIdWithName } from '../../../shared/interfaces/id-with-name';
import { ILogInAndGetClientDataResult } from '../log-in-and-get-client-data-result';
import { IStartedDeviceCalcBillData } from '../started-device-calc-bill-data';

export class MSSqlDatabaseStorageProvider implements StorageProvider {
    private config: ConnectionConfig;
    private dbHelper: DatabaseHelper;
    private logger: { log: Function, error: Function };

    initialize(config: any, logger: any): void {
        this.logger = logger;
        this.config = <ConnectionConfig>(config);
        this.dbHelper = new DatabaseHelper(this.config, this.logger);
    }
    async getSetting(name: string): Promise<string | null> {
        return await this.dbHelper.getDatabaseSetting(null, name);
    }

    async getStartedDeviceCalcBillData(deviceId: string): Promise<IStartedDeviceCalcBillData> {
        return (await this.getStartedDevicesCalcBillDataImpl(deviceId))[0];
    }

    async getStartedDevicesCalcBillData(): Promise<IStartedDeviceCalcBillData[]> {
        return await this.getStartedDevicesCalcBillDataImpl(null);
    }

    async logInAndGetClientData(username: string, password: string, clientDeviceId: string): Promise<ILogInAndGetClientDataResult> {
        const passwordHash = this.dbHelper.getSha512(password);
        const sql = `
            SELECT c.[Id] AS [ClientId], c.[Disabled], c.[Credit], cg.[PricePerHour]
            FROM [Clients] c
            INNER JOIN [ClientsGroups] cg ON c.[ClientGroupId]=cg.[Id]
            INNER JOIN [ClientsGroupsWithDevicesGroups] cgwdg ON cg.[Id]=cgwdg.[ClientGroupId]
            INNER JOIN [DevicesGroups] dg ON cgwdg.[DeviceGroupId]=dg.[Id]
            INNER JOIN [ClientDevices] cd ON dg.[Id]=cd.[DeviceGroupId] AND cd.[Id]=@ClientDeviceId
            WHERE c.[Username]=@Username AND c.[Password]=@PasswordHash
        `;
        const params: IRequestParameter[] = [
            { name: 'Username', value: username, type: TYPES.NVarChar },
            { name: 'PasswordHash', value: passwordHash, type: TYPES.NVarChar },
            { name: 'ClientDeviceId', value: clientDeviceId, type: TYPES.NVarChar }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        if (!result.firstResultSet.rows.length) {
            return <ILogInAndGetClientDataResult>{
                notFound: true
            };
        }
        return <ILogInAndGetClientDataResult>result.firstResultSet.rows[0];
    }

    async updateClient(client: IClient): Promise<boolean> {
        const sql = `
            UPDATE [Clients]
            SET [Email]=@Email,
                [FirstName]=@FirstName,
                [LastName]=@LastName,
                [Phone]=@Phone,
                [Disabled]=@Disabled,
                [ClientGroupId]=@ClientGroupId
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Email', value: client.email, type: TYPES.NVarChar },
            { name: 'FirstName', value: client.firstName, type: TYPES.NVarChar },
            { name: 'LastName', value: client.lastName, type: TYPES.NVarChar },
            { name: 'Phone', value: client.phone, type: TYPES.NVarChar },
            { name: 'Disabled', value: client.disabled, type: TYPES.Bit },
            { name: 'ClientGroupId', value: client.clientGroupId, type: TYPES.UniqueIdentifierN },
            { name: 'Id', value: client.id, type: TYPES.UniqueIdentifierN }
        ];
        const updateResult = await this.dbHelper.execRowCount(sql, params);
        return updateResult === 1;
    }

    async createClient(client: IClient): Promise<ICreateEntityResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Username]
                FROM [Clients]
                WHERE [Username]=@Username
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                INSERT INTO [Clients]
                ([Id], [Username], [Password], [Email], [FirstName], [LastName], [Phone], [Disabled], [ClientGroupId], [Credit]) VALUES
                (@Id, @Username, @Password, @Email, @FirstName, @LastName, @Phone, @Disabled, @ClientGroupId, 0)
            END
        `;
        const passwordHash = this.dbHelper.getSha512(client.password);
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'Username', value: client.username, type: TYPES.NVarChar },
            { name: 'Password', value: passwordHash, type: TYPES.NVarChar },
            { name: 'Email', value: client.email, type: TYPES.NVarChar },
            { name: 'FirstName', value: client.firstName, type: TYPES.NVarChar },
            { name: 'LastName', value: client.lastName, type: TYPES.NVarChar },
            { name: 'Phone', value: client.phone, type: TYPES.NVarChar },
            { name: 'Disabled', value: client.disabled, type: TYPES.Bit },
            { name: 'ClientGroupId', value: client.clientGroupId, type: TYPES.UniqueIdentifierN }
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }

        return <ICreateEntityResult>{
            createdId: newId,
            alreadyExists: alreadyExists
        };
    }

    async getClients(): Promise<IClient[]> {
        const sql = `
            SELECT [Id], [Username], [Email], [FirstName], [LastName], [Phone], [Disabled], [ClientGroupId], [Credit]
            FROM [Clients]
            ORDER BY [Username]
        `;
        const getResult = await this.dbHelper.execToObjects(sql);
        return <IClient[]>getResult.firstResultSet.rows;
    }

    async createClientGroupWithDevicesGroupsIds(
        clientGroupWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds
    ): Promise<ICreateClientGroupResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Name]
                FROM [ClientsGroups]
                WHERE [Id]<>@Id
                AND [Name]=@Name
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                INSERT INTO [ClientsGroups]
                ([Id], [Name], [Description], [PricePerHour]) VALUES
                (@Id, @Name, @Description, @PricePerHour)
        `;
        const clientGroup = clientGroupWithDevicesGroupsIds.clientGroup;
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'Name', value: clientGroup.name, type: TYPES.NVarChar },
            { name: 'Description', value: clientGroup.description, type: TYPES.NVarChar },
            { name: 'PricePerHour', value: clientGroup.pricePerHour, type: TYPES.Money },
        ];
        if (clientGroupWithDevicesGroupsIds) {
            for (let i = 0; i < clientGroupWithDevicesGroupsIds.devicesGroupsIds.length; i++) {
                const deviceGroupIdParamName = `DeviceGroupId${i}`;
                sql += `
                    INSERT INTO [ClientsGroupsWithDevicesGroups]
                    ([ClientGroupId], [DeviceGroupId]) VALUES
                    (@Id, @${deviceGroupIdParamName})
                `;
                params.push({
                    name: deviceGroupIdParamName,
                    value: clientGroupWithDevicesGroupsIds.devicesGroupsIds[i],
                    type: TYPES.UniqueIdentifierN
                });
            }
        }
        sql += 'END';
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }
        const result = <ICreateClientGroupResult>{
            alreadyExists: alreadyExists,
            createdId: newId
        };
        return result;
    }

    async updateClientGroupWithDevicesGroupsIds(
        clientGroupWithDevicesGroupsIds: IClientGroupWithDevicesGroupsIds
    ): Promise<IUpdateClientGroupResult> {
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Name]
                FROM [ClientsGroups]
                WHERE [Id]<>@Id
                AND [Name]=@Name
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                UPDATE [ClientsGroups]
                SET [Name]=@Name,
                    [Description]=@Description,
                    [PricePerHour]=@PricePerHour
                WHERE [Id]=@Id

                DELETE FROM [ClientsGroupsWithDevicesGroups]
                WHERE [ClientGroupId]=@Id
        `;
        const clientGroup = clientGroupWithDevicesGroupsIds.clientGroup;
        const params: IRequestParameter[] = [
            { name: 'Id', value: clientGroup.id, type: TYPES.UniqueIdentifierN },
            { name: 'Name', value: clientGroup.name, type: TYPES.NVarChar },
            { name: 'Description', value: clientGroup.description, type: TYPES.NVarChar },
            { name: 'PricePerHour', value: clientGroup.pricePerHour, type: TYPES.Money },
        ];
        if (clientGroupWithDevicesGroupsIds) {
            for (let i = 0; i < clientGroupWithDevicesGroupsIds.devicesGroupsIds.length; i++) {
                const deviceGroupIdParamName = `DeviceGroupId${i}`;
                sql += `
                    INSERT INTO [ClientsGroupsWithDevicesGroups]
                    ([ClientGroupId], [DeviceGroupId]) VALUES
                    (@Id, @${deviceGroupIdParamName})
                `;
                params.push({
                    name: deviceGroupIdParamName,
                    value: clientGroupWithDevicesGroupsIds.devicesGroupsIds[i],
                    type: TYPES.UniqueIdentifierN
                });
            }
        }
        sql += 'END';
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        return <IUpdateClientGroupResult>{
            alreadyExists: alreadyExists
        };
    }

    async getClientsGroupsWithDevicesGroupsIds(): Promise<IClientGroupWithDevicesGroupsIds[]> {
        const sql = `
            SELECT cg.[Id], cg.[Name], cg.[Description], cg.[PricePerHour],
                   dg.[Id] AS DeviceGroupId, dg.[Name] AS DeviceGroupName
            FROM [ClientsGroups] cg
            LEFT OUTER JOIN [ClientsGroupsWithDevicesGroups] cgwdg ON cgwdg.[ClientGroupId]=cg.[Id]
            LEFT OUTER JOIN [DevicesGroups] dg ON dg.[Id]=cgwdg.[DeviceGroupId]
            ORDER BY [Name]
        `;
        const groupsWithDevicesGroupsIdsResult = await this.dbHelper.execToObjects(sql);
        const groupsWithDevicesGroupsIds = this.dbHelper.groupAndRename(
            groupsWithDevicesGroupsIdsResult.firstResultSet.rows,
            { id: '', name: '', description: '', pricePerHour: '' },
            { deviceGroupId: 'id', deviceGroupName: 'name' },
            'clientGroup',
            'devicesGroups'
        );
        const result: IClientGroupWithDevicesGroupsIds[] = [];
        for (let i = 0; i < groupsWithDevicesGroupsIds.length; i++) {
            const item = groupsWithDevicesGroupsIds[i];
            const obj = <IClientGroupWithDevicesGroupsIds>{
                clientGroup: item.clientGroup
            };
            obj.devicesGroupsIds = (<IIdWithName[]>item.devicesGroups).filter(x => x.id).map(x => x.id);
            result.push(obj);
        }
        return result;
    }

    async createDeviceGroup(deviceGroup: IDeviceGroup): Promise<ICreateDeviceGroupResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Name]
                FROM [DevicesGroups]
                WHERE [Id]<>@Id
                AND [Name]=@Name
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                INSERT INTO [DevicesGroups]
                ([Id], [Name], [Description], [PricePerHour]) VALUES
                (@Id, @Name, @Description, @PricePerHour)
            END
        `;
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'Name', value: deviceGroup.name, type: TYPES.NVarChar },
            { name: 'Description', value: deviceGroup.description, type: TYPES.NVarChar },
            { name: 'PricePerHour', value: deviceGroup.pricePerHour, type: TYPES.Money },
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }
        const result = <ICreateDeviceGroupResult>{
            alreadyExists: alreadyExists,
            createdId: newId
        };
        return result;
    }

    async updateDeviceGroup(deviceGroup: IDeviceGroup): Promise<IUpdateDeviceGroupResult> {
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Name]
                FROM [DevicesGroups]
                WHERE [Id]<>@Id
                AND [Name]=@Name
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                UPDATE [DevicesGroups]
                SET [Name]=@Name,
                    [Description]=@Description,
                    [PricePerHour]=@PricePerHour
                WHERE [Id]=@Id
            END
        `;
        const params: IRequestParameter[] = [
            { name: 'Id', value: deviceGroup.id, type: TYPES.UniqueIdentifierN },
            { name: 'Name', value: deviceGroup.name, type: TYPES.NVarChar },
            { name: 'Description', value: deviceGroup.description, type: TYPES.NVarChar },
            { name: 'PricePerHour', value: deviceGroup.pricePerHour, type: TYPES.Money },
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        return <IUpdateDeviceGroupResult>{
            alreadyExists: alreadyExists
        };
    }

    async getDevicesGroups(): Promise<IDeviceGroup[]> {
        const sql = `
            SELECT [Id], [Name], [Description], [PricePerHour]
            FROM [DevicesGroups]
            ORDER BY [Name]
        `;
        const getResult = await this.dbHelper.execToObjects(sql);
        return <IDeviceGroup[]>getResult.firstResultSet.rows;
    }

    async stopClientDevice(data: IStopClientDeviceData): Promise<IStopClientDeviceResult> {
        const newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS (
                SELECT TOP 1 [IsStarted]
                FROM [ClientDevicesStatus]
                WHERE [DeviceId]=@DeviceId AND [IsStarted]=0
            )
                BEGIN
                    SELECT [AlreadyStopped]=CAST(1 as bit)
                END
                ELSE
                BEGIN
                    SELECT [AlreadyStopped]=CAST(0 as bit)
                    UPDATE [ClientDevicesStatus]
                    SET [IsStarted]=0,
                        [StoppedAt]=@StoppedAt,
                        [StoppedAtUptime]=@StoppedAtUptime,
                        [StoppedByEmployeeId]=@StoppedByEmployeeId,
                        [LastBill]=@LastBill
                    WHERE [DeviceId]=@DeviceId

                    DECLARE @CurrentStartedByClientId uniqueidentifier
                    DECLARE @CurrentStartedByEmployeeId uniqueidentifier
                    DECLARE @CurrentStartedAt decimal(16,0)
                    DECLARE @CurrentStartedAtUptime decimal(16,0)
                    SELECT @CurrentStartedByClientId=[StartedByClientId],
                           @CurrentStartedByEmployeeId=[StartedByEmployeeId],
                           @CurrentStartedAt=[StartedAt],
                           @CurrentStartedAtUptime=[StartedAtUptime]
                    FROM [ClientDevicesStatus]
                    WHERE [DeviceId]=@DeviceId

                    INSERT INTO [ClientDevicesStatusHistory]
                    ([Id], [DeviceId], [StartedByClientId], [StartedByEmployeeId], [StartedAt], [StartedAtUptime],
                    [StoppedByEmployeeId], [StoppedAt], [StoppedAtUptime], [Bill]) VALUES
                    (@Id, @DeviceId, @CurrentStartedByClientId, @CurrentStartedByEmployeeId, @CurrentStartedAt, @CurrentStartedAtUptime,
                    @StoppedByEmployeeId, @StoppedAt, @StoppedAtUptime, @LastBill)
                END
        `;
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'DeviceId', value: data.args.deviceId, type: TYPES.UniqueIdentifierN },
            { name: 'StoppedAt', value: data.stoppedAt, type: TYPES.Decimal },
            { name: 'StoppedAtUptime', value: data.stoppedAtUptime, type: TYPES.Decimal },
            { name: 'StoppedByEmployeeId', value: data.stoppedByEmployeeId, type: TYPES.UniqueIdentifierN },
            { name: 'LastBill', value: data.lastBill, type: TYPES.Money }
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const execResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyStopped = (<{ alreadyStopped: boolean }>execResult.firstResultSet.rows[0]).alreadyStopped;
        const result: IStopClientDeviceResult = {
            alreadyStopped: alreadyStopped
        };
        return result;
    }

    async startClientDevice(data: IStartClientDeviceData): Promise<IStartClientDeviceResult> {
        let sql = `
            IF EXISTS (
                SELECT TOP 1 [IsStarted]
                FROM [ClientDevicesStatus]
                WHERE [DeviceId]=@DeviceId AND [IsStarted]=1
            )
                BEGIN
                    SELECT [AlreadyStarted]=CAST(1 as bit)
                END
                ELSE
                BEGIN
                    SELECT [AlreadyStarted]=CAST(0 as bit)
                    UPDATE [ClientDevicesStatus]
                    SET [IsStarted]=1,
                        [StartedAt]=@StartedAt,
                        [StartedAtUptime]=@StartedAtUptime,
                        [StartedByClientId]=@StartedByClientId,
                        [StartedByEmployeeId]=@StartedByEmployeeId
                    WHERE [DeviceId]=@DeviceId
                END
        `;
        const params: IRequestParameter[] = [
            { name: 'DeviceId', value: data.args.deviceId, type: TYPES.UniqueIdentifierN },
            { name: 'StartedAt', value: data.startedAt, type: TYPES.Decimal },
            { name: 'StartedAtUptime', value: data.startedAtUptime, type: TYPES.Decimal },
            { name: 'StartedByClientId', value: data.startedByClientId, type: TYPES.UniqueIdentifierN },
            { name: 'StartedByEmployeeId', value: data.startedByEmployeeId, type: TYPES.UniqueIdentifierN }
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const execResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyStarted = (<{ alreadyStarted: boolean }>execResult.firstResultSet.rows[0]).alreadyStarted;
        const result: IStartClientDeviceResult = {
            alreadyStarted: alreadyStarted
        };
        return result;
    }

    async getClientDeviceStatus(deviceId: string): Promise<IClientDeviceStatus> {
        return (await this.getClientDevicesStatusImpl(deviceId))[0];
    }

    async getClientDevicesStatus(): Promise<IClientDeviceStatus[]> {
        return this.getClientDevicesStatusImpl(null);
    }

    async createRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<ICreateRoleWithPermissionsIdsResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Name]
                FROM [Roles]
                WHERE [Name]=@Name
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                INSERT INTO [Roles]
                ([Id], [Name], [Description]) VALUES
                (@Id, @Name, @Description)
        `;
        const role = roleWithPermissionsIds.role;
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'Name', value: role.name, type: TYPES.NVarChar },
            { name: 'Description', value: role.description, type: TYPES.NVarChar },
        ];
        for (let i = 0; i < roleWithPermissionsIds.permissionsIds.length; i++) {
            const permissionId = roleWithPermissionsIds.permissionsIds[i];
            const permissionIdParamName = `PermissionId${i}`;
            sql += `
                INSERT INTO [PermissionsInRoles]
                ([PermissionId], [RoleId]) VALUES
                (@${permissionIdParamName}, @Id)
            `;
            params.push({ name: permissionIdParamName, value: permissionId, type: TYPES.UniqueIdentifierN });
        }
        sql += `
            END
        `;
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }

        return <ICreateRoleWithPermissionsIdsResult>{
            createdId: newId,
            alreadyExists: alreadyExists
        };
    }

    async updateEmployee(employee: IEmployee): Promise<void> {
        const sql = `
            UPDATE [Employees]
            SET [FirstName]=@FirstName,
                [LastName]=@LastName,
                [Email]=@Email,
                [Disabled]=@Disabled
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'FirstName', value: employee.firstName, type: TYPES.NVarChar },
            { name: 'LastName', value: employee.lastName, type: TYPES.NVarChar },
            { name: 'Email', value: employee.email, type: TYPES.NVarChar },
            { name: 'Disabled', value: employee.disabled, type: TYPES.Bit },
            { name: 'Id', value: employee.id, type: TYPES.UniqueIdentifierN }
        ];
        await this.dbHelper.execRowCount(sql, params);
    }

    async updateRoleWithPermissionsIds(roleWithPermissionsIds: IRoleWithPermissionsIds): Promise<void> {
        let sql = `
                UPDATE [Roles]
                SET [Name]=@Name,
                    [Description]=@Description
                WHERE [Id]=@Id

                DELETE FROM [PermissionsInRoles]
                WHERE [RoleId]=@Id
        `;
        const role = roleWithPermissionsIds.role;
        const params: IRequestParameter[] = [
            { name: 'Name', value: role.name, type: TYPES.NVarChar },
            { name: 'Description', value: role.description, type: TYPES.NVarChar },
            { name: 'Id', value: role.id, type: TYPES.UniqueIdentifierN },
        ];
        for (let i = 0; i < roleWithPermissionsIds.permissionsIds.length; i++) {
            const permissionId = roleWithPermissionsIds.permissionsIds[i];
            const permissionIdParamName = `PermissionId${i}`;
            sql += `
                INSERT INTO [PermissionsInRoles]
                ([PermissionId], [RoleId]) VALUES
                (@${permissionIdParamName}, @Id)
            `;
            params.push({ name: permissionIdParamName, value: permissionId, type: TYPES.UniqueIdentifierN });
        }
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        await this.dbHelper.execRowCount(sql, params);
    }

    async getRolesWithPermissionsIds(): Promise<IRoleWithPermissionsIds[]> {
        const sql = `
            SELECT r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS [RoleDescription],
            p.[Id] AS [PermissionId]
            FROM [Roles] r
            LEFT OUTER JOIN [PermissionsInRoles] pir ON pir.[RoleId] = r.[Id]
            LEFT OUTER JOIN [Permissions] p ON p.[Id] = pir.[PermissionId]
        `;
        const rolesWithPermissionsResult = await this.dbHelper.execToObjects(sql);
        const rolesWithPermissions = <IRoleWithPermissions[]>this.dbHelper.groupAndRename(
            rolesWithPermissionsResult.firstResultSet.rows,
            { roleId: 'id', roleName: 'name', roleDescription: 'description' },
            { permissionId: 'id' },
            'role',
            'permissions'
        );
        const result: IRoleWithPermissionsIds[] = [];
        for (let i = 0; i < rolesWithPermissions.length; i++) {
            const item = rolesWithPermissions[i];
            const roleWithPermissionsIds: IRoleWithPermissionsIds = {
                role: item.role,
                permissionsIds: item.permissions.filter(x => x.id).map(x => x.id)
            };
            result.push(roleWithPermissionsIds);
        }
        return result;
    }

    async setClientFiles(clientFiles: IClientFilesData): Promise<void> {
        let sql = `
            IF EXISTS (
                SELECT TOP 1 [Name] FROM [Settings]
                WHERE [Name]=@Name
            )
                BEGIN
                    UPDATE [Settings]
                    SET [Value]=@Value
                    WHERE [Name]=@Name
                END
                ELSE
                BEGIN
                    INSERT INTO [Settings]
                    ([Name], [Value]) VALUES
                    (@Name, @Value)
                END
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', value: 'client.files', type: TYPES.NVarChar },
            { name: 'Value', value: JSON.stringify(clientFiles), type: TYPES.NVarChar }
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        await this.dbHelper.execRowCount(sql, params);
    }

    async getClientStartupData(): Promise<IClientStartupData | null> {
        const result = <IClientStartupData>{};
        const setting = await this.dbHelper.getDatabaseSetting(null, 'client.files');
        if (setting) {
            result.clientFiles = <IClientFilesData>JSON.parse(setting);
        } else {
            result.clientFiles = null;
        }
        // TODO Add more data
        return result;
    }

    async updateClientDevice(clientDevice: IClientDevice): Promise<void> {
        const sql = `
            UPDATE [ClientDevices]
            SET [Name]=@Name,
                [Address]=@Address,
                [Description]=@Description,
                [Approved]=@Approved,
                [ApprovedAt]=CASE WHEN (@Approved=1 AND [ApprovedAt] IS NULL) THEN @ApprovedAt ELSE [ApprovedAt] END,
                [DeviceGroupId]=@DeviceGroupId
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', value: clientDevice.name, type: TYPES.NVarChar },
            { name: 'Address', value: clientDevice.address, type: TYPES.NVarChar },
            { name: 'Description', value: clientDevice.description, type: TYPES.NVarChar },
            { name: 'Approved', value: clientDevice.approved, type: TYPES.Bit },
            { name: 'ApprovedAt', value: clientDevice.approvedAt, type: TYPES.Decimal },
            { name: 'DeviceGroupId', value: clientDevice.deviceGroup.id, type: TYPES.UniqueIdentifier },
            { name: 'Id', value: clientDevice.id, type: TYPES.NVarChar },
        ];
        await this.dbHelper.execRowCount(sql, params);
    }

    async registerClientDevice(id: string, name: string, address: string, deviceGroupId: string): Promise<IRegisterClientDeviceResult> {
        let sql = `
            IF EXISTS (
                SELECT TOP 1 [Id]
                FROM [ClientDevices]
                WHERE [Id]=@Id
            )
                BEGIN
                    SELECT [CreatedNew]=CAST(0 AS bit)
                END
                ELSE
                BEGIN
                    SELECT [CreatedNew]=CAST(1 AS bit)
                    INSERT INTO [ClientDevices]
                    ([Id], [Name], [Address], [Approved], [DeviceGroupId]) VALUES
                    (@Id, @Name, @Address, 0, @DeviceGroupId)

                    INSERT INTO [ClientDevicesStatus]
                    ([DeviceId], [IsStarted], [StartedAt], [StartedByClientId], [StoppedAt]) VALUES
                    (@Id, 0, NULL, NULL, NULL)
                END

            SELECT TOP 1 cd.[Id], cd.[Name], cd.[Address], cd.[Description], cd.[Approved], cd.[ApprovedAt], cd.[DeviceGroupId],
                         dg.[Name] AS [DeviceGroupName]
            FROM [ClientDevices] cd
            INNER JOIN [DevicesGroups] dg ON cd.[DeviceGroupId] = dg.[Id]
            WHERE cd.[Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Id', value: id, type: TYPES.NVarChar },
            { name: 'Name', value: name, type: TYPES.NVarChar },
            { name: 'Address', value: address, type: TYPES.NVarChar },
            { name: 'DeviceGroupId', value: deviceGroupId, type: TYPES.UniqueIdentifierN }
        ];
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const registerDeviceResult = await this.dbHelper.execToObjects(sql, params);
        const createdNew = (<{ createdNew: boolean }>registerDeviceResult.firstResultSet.rows[0]).createdNew;
        const device = this.getClientDevicesFromRows([registerDeviceResult.allResultSets[1].rows[0]])[0];
        const result = <IRegisterClientDeviceResult>{
            clientDevice: device,
            createdNew: createdNew
        };
        return result;
    }

    async getClientDevice(deviceId: string): Promise<IClientDevice> {
        const sql = `
            SELECT TOP 1 cd.[Id], cd.[Name], cd.[Address], cd.[Description], cd.[Approved], cd.[ApprovedAt], cd.[DeviceGroupId],
                         dg.[Name] AS [DeviceGroupName]
            FROM [ClientDevices] cd
            INNER JOIN [DevicesGroups] dg ON cd.[DeviceGroupId] = dg.[Id]
            WHERE cd.[Id]=@DeviceId
            ORDER BY cd.[Name]
        `;
        const params: IRequestParameter[] = [
            { name: 'DeviceId', value: deviceId, type: TYPES.NVarChar }
        ];
        const getResult = await this.dbHelper.execToObjects(sql, params);
        const clientDevice = this.getClientDevicesFromRows([getResult.firstResultSet.rows[0]])[0];
        return clientDevice;
    }

    async getClientDevices(): Promise<IClientDevice[]> {
        const sql = `
            SELECT cd.[Id], cd.[Name], cd.[Address], cd.[Description], cd.[Approved], cd.[ApprovedAt], cd.[DeviceGroupId],
                   dg.[Name] AS [DeviceGroupName]
            FROM [ClientDevices] cd
            INNER JOIN [DevicesGroups] dg ON cd.[DeviceGroupId] = dg.[Id]
            ORDER BY cd.[Name]
        `;
        const getResult = await this.dbHelper.execToObjects(sql);
        const clientDevices = this.getClientDevicesFromRows(getResult.firstResultSet.rows);
        return clientDevices;
    }

    getClientDevicesFromRows(rows: any): IClientDevice[] {
        const keyObjectMap = { id: '', name: '', address: '', description: '', approved: '', approvedAt: '' };
        const itemsObjectMap = { deviceGroupId: 'id', deviceGroupName: 'name' };
        const groupedAndRenamed = this.dbHelper.groupAndRename(
            rows,
            keyObjectMap,
            itemsObjectMap,
            'clientDevice',
            'deviceGroup'
        );
        const clientDevices = groupedAndRenamed.map(x => this.getClientDeviceFromGroup(x));
        return clientDevices;
    }

    getClientDeviceFromGroup(group: any): IClientDevice {
        const firstGroup = group;
        const clientDevice = <IClientDevice>firstGroup.clientDevice;
        clientDevice.deviceGroup = <IDeviceGroup>firstGroup.deviceGroup[0];
        return clientDevice;
    }

    async createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<ICreateEmployeeResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            IF EXISTS(
                SELECT TOP 1 [Username]
                FROM [Employees]
                WHERE [Username]=@Username
            )
            BEGIN
                SELECT [AlreadyExists]=CAST(1 as bit)
            END
            ELSE
            BEGIN
                SELECT [AlreadyExists]=CAST(0 as bit)
                INSERT INTO [Employees]
                ([Id], [Username], [Password], [FirstName], [LastName], [Email], [Disabled]) VALUES
                (@Id, @Username, @Password, @FirstName, @LastName, @Email, @Disabled)
        `;
        const employee = employeeWithRoles.employee;
        const passwordHash = this.dbHelper.getSha512(employee.password);
        const params: IRequestParameter[] = [
            { name: 'Id', value: newId, type: TYPES.UniqueIdentifierN },
            { name: 'Username', value: employee.username, type: TYPES.NVarChar },
            { name: 'Password', value: passwordHash, type: TYPES.NVarChar },
            { name: 'FirstName', value: employee.firstName, type: TYPES.NVarChar },
            { name: 'LastName', value: employee.lastName, type: TYPES.NVarChar },
            { name: 'Email', value: employee.email, type: TYPES.NVarChar },
            { name: 'Disabled', value: employee.disabled, type: TYPES.Bit },
        ];
        for (let i = 0; i < employeeWithRoles.roles.length; i++) {
            const roleId = employeeWithRoles.roles[i].id;
            const roleIdParamName = `RoleId${i}`;
            sql += `
                    INSERT INTO [EmployeesInRoles]
                    ([EmployeeId], [RoleId]) VALUES
                    (@Id, @${roleIdParamName})
            `;
            params.push({ name: roleIdParamName, value: roleId, type: TYPES.UniqueIdentifierN });
        }
        sql += `
            END
        `;
        sql = this.dbHelper.encloseInBeginTryTransactionBlocks(sql);
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }

        return <ICreateEmployeeResult>{
            createdId: newId,
            alreadyExists: alreadyExists
        };
    }

    async getRoles(): Promise<IRole[]> {
        const sql = `
            SELECT [Id], [Name], [Description]
            FROM [Roles]
            ORDER BY [Name]
        `;
        const getAllRolesResult = await this.dbHelper.execToObjects(sql);
        return <IRole[]>getAllRolesResult.firstResultSet.rows;
    }

    async getEmployeesWithRoles(): Promise<IEmployeeWithRoles[]> {
        const sql = `
            SELECT e.[Id], e.[Username], e.[FirstName], e.[LastName], e.[Email], e.[Disabled],
                   r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS [RoleDescription]
            FROM [Employees] e
            LEFT OUTER JOIN [EmployeesInRoles] eir ON eir.[EmployeeId] = e.[Id]
            LEFT OUTER JOIN [Roles] r ON r.[Id] = eir.[RoleId]
            ORDER BY [Username]
        `;
        const employeeWithRolesResult = await this.dbHelper.execToObjects(sql);
        const keyObjectMap = {
            id: '',
            username: '',
            firstName: '',
            lastName: '',
            email: '',
            disabled: ''
        };
        const itemsObjectMap = {
            roleId: 'id',
            roleName: 'name',
            roleDescription: 'description'
        };
        const grouped = this.dbHelper.groupByProperties(employeeWithRolesResult.firstResultSet.rows, keyObjectMap, itemsObjectMap);
        const renamed = this.dbHelper.getGroupsWithChangedProperties(grouped, 'employee', 'roles');
        // Remove roles with id=null
        renamed.forEach(x => x.roles = (<any[]>x.roles).filter(y => y.id));
        return renamed;
    }

    async updateEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<void> {
        let sql = `
            UPDATE [Employees]
            SET [FirstName]=@FirstName,
                [LastName]=@LastName,
                [Email]=@Email,
                [Disabled]=@Disabled
            WHERE [Id]=@Id

            DELETE FROM [EmployeesInRoles]
            WHERE [EmployeeId]=@Id
        `;
        const params: IRequestParameter[] = [];
        for (let i = 0; i < employeeWithRoles.roles.length; i++) {
            const paramName = `EmployeeRole${i}`;
            sql += `
                INSERT INTO [EmployeesInRoles]
                ([EmployeeId], [RoleId]) VALUES
                (@Id, @${paramName})
            `;
            params.push({ name: paramName, value: employeeWithRoles.roles[i].id, type: TYPES.UniqueIdentifierN });
        }
        const employee = employeeWithRoles.employee;
        params.push(...[
            { name: 'FirstName', value: employee.firstName, type: TYPES.NVarChar },
            { name: 'LastName', value: employee.lastName, type: TYPES.NVarChar },
            { name: 'Email', value: employee.email, type: TYPES.NVarChar },
            { name: 'Disabled', value: employee.disabled, type: TYPES.Bit },
            { name: 'Id', value: employee.id, type: TYPES.UniqueIdentifierN }
        ]);
        await this.dbHelper.execRowCount(sql, params);
    }

    async getEmployeePermissionsIds(employeeId: string): Promise<string[]> {
        const sql = `
            SELECT p.[Id]
            FROM [Permissions] p
            INNER JOIN [PermissionsInRoles] pir ON pir.[PermissionId] = p.[Id]
            INNER JOIN [EmployeesInRoles] eir ON eir.[RoleId] = pir.[RoleId]
            WHERE eir.[EmployeeId] = @EmployeeId
        `;
        const params: IRequestParameter[] = [
            { name: 'EmployeeId', value: employeeId, type: TYPES.UniqueIdentifierN }
        ];
        const employeePermissionsResult = await this.dbHelper.execToObjects(sql, params);
        return <string[]>employeePermissionsResult.firstResultSet.rows;
    }

    async getTokenSecret(): Promise<string | null> {
        return this.dbHelper.getTokenSecret();
    }

    async getEmployeeWithRolesAndPermissions(username: string, password: string): Promise<IEmployeeWithRolesAndPermissions> {
        // First get employee
        const employee = await this.getEmployeeByUsernameAndPassword(username, password);
        if (!employee) {
            // Such employee is not found - return empty result
            return Promise.resolve(<IEmployeeWithRolesAndPermissions>{});
        }
        // Now get employee permissions
        const sql = `
            SELECT r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS [RoleDescription],
            p.[Id] AS [PermissionId], p.[Name] AS [PermissionName], p.[Description] AS [PermissionDescription]
            FROM [Roles] r
            INNER JOIN [EmployeesInRoles] eir ON eir.[RoleId] = r.[Id]
            INNER JOIN [PermissionsInRoles] pir ON pir.[RoleId] = r.[Id]
            INNER JOIN [Permissions] p ON p.[Id] = pir.[PermissionId]
            WHERE eir.[EmployeeId] = @EmployeeId
        `;
        const userWithPermissionsParams: IRequestParameter[] = [
            { name: 'EmployeeId', value: employee.id, type: TYPES.NVarChar }
        ];
        const rolesWithPermissionsResult = await this.dbHelper.execToObjects(sql, userWithPermissionsParams);
        const keyObjectMap = { roleId: 'id', roleName: 'name', roleDescription: 'description' };
        const itemsObjectMap = { permissionId: 'id', permissionName: 'name', permissionDescription: 'description' };
        const groupedRolesWithPermissions = this.dbHelper.groupAndRename(
            rolesWithPermissionsResult.firstResultSet.rows,
            keyObjectMap,
            itemsObjectMap,
            'role',
            'permissions'
        );
        return <IEmployeeWithRolesAndPermissions>{
            employee: employee,
            rolesWithPermissions: <any>groupedRolesWithPermissions
        };
    }

    async getPermissions(): Promise<IPermission[]> {
        const sql = `
            SELECT [Id], [Name], [Description]
            FROM [Permissions]
            ORDER BY [Name]
        `;
        const permissions = await this.dbHelper.execToObjects(sql);
        return permissions.firstResultSet.rows;
    }

    async createStorage(appAdministatorPassword: string): Promise<ICreateStorageResult> {
        return await this.dbHelper.createDatabase(appAdministatorPassword);
    }

    async prepareStorage(): Promise<IPrepareStorageResult> {
        return this.dbHelper.prepareDatabase();
    }

    private async getStartedDevicesCalcBillDataImpl(deviceId: string | null): Promise<IStartedDeviceCalcBillData[]> {
        let sql = `
            SELECT cds.[DeviceId],
                   cds.[StartedByClientId],
                   cds.[StartedByEmployeeId],
                   cds.[StartedAt],
                   cds.[StartedAtUptime],
                   cg.[PricePerHour] AS ClientGroupPricePerHour,
                   dg.[PricePerHour] AS DeviceGroupPricePerHour,
                   c.[Credit] AS ClientCredit
            FROM [ClientDevicesStatus] cds
            INNER JOIN [ClientDevices] cd ON cds.[DeviceId]=cd.[Id]
            LEFT OUTER JOIN [Clients] c ON cds.[StartedByClientId]=c.[Id]
            LEFT OUTER JOIN [ClientsGroups] cg ON c.[ClientGroupId]=cg.[Id]
            INNER JOIN [DevicesGroups] dg ON cd.[DeviceGroupId]=dg.[Id]
            WHERE cds.[IsStarted]=1
        `;
        const params: IRequestParameter[] = [];
        if (deviceId) {
            sql += ' AND cds.[DeviceId]=@DeviceId';
            params.push({ name: 'DeviceId', value: deviceId, type: TYPES.NVarChar });
        }
        const getResult = await this.dbHelper.execToObjects(sql, params);
        return <IStartedDeviceCalcBillData[]>getResult.firstResultSet.rows;
    }

    private async getClientDevicesStatusImpl(deviceId: string | null): Promise<IClientDeviceStatus[]> {
        let sql = `
            SELECT cds.[DeviceId], cds.[IsStarted], cds.[StartedAt],
                   cds.[StartedByClientId], cds.[StoppedAt], cds.[StartedAtUptime],
                   cds.[StoppedAtUptime], cds.[LastBill],
                   cd.[Name], cd.[Approved],
                   dg.[PricePerHour]
            FROM [ClientDevicesStatus] cds
            INNER JOIN [ClientDevices] cd ON cds.[DeviceId]=cd.[Id]
            INNER JOIN [DevicesGroups] dg ON cd.[DeviceGroupId]=dg.[Id]
            WHERE cd.[Approved]=1
        `;
        const params: IRequestParameter[] = [];
        if (deviceId) {
            sql += `
                AND cds.[DeviceId]=@DeviceId
            `;
            params.push(
                { name: 'DeviceId', value: deviceId, type: TYPES.UniqueIdentifierN }
            );
        }
        const getResult = await this.dbHelper.execToObjects(sql, params);
        return <IClientDeviceStatus[]>getResult.firstResultSet.rows;
    }

    private async getEmployeeByUsernameAndPassword(username: string, password: string): Promise<IEmployee | null> {
        const sql = `
            SELECT TOP 1 [Id], [Username], [Disabled]
            FROM [Employees]
            WHERE [Username]=@Username AND [Password]=@PasswordHash
        `;
        const passwordHash = this.dbHelper.getSha512(password);
        const params: IRequestParameter[] = [
            { name: 'Username', value: username, type: TYPES.NVarChar },
            { name: 'PasswordHash', value: passwordHash, type: TYPES.NVarChar }
        ];
        const employeeData = await this.dbHelper.execToObjects(sql, params);
        if (!employeeData.firstResultSet.rows.length) {
            return null;
        }
        return <IEmployee>employeeData.firstResultSet.rows[0];
    }
}
