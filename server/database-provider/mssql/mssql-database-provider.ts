import { ConnectionConfig, TYPES } from 'tedious';

import { DatabaseProvider } from '../database-provider';
import { IPrepareDatabaseResult } from '../prepare-database-result';
import { ICreateDatabaseResult } from '../create-database-result';
import { DatabaseHelper, IRequestParameter, IGroup } from './database-helper';
import { IPermission } from '../../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../../shared/interfaces/employee-with-roles-and-permissions';
import { IRoleWithPermissions } from '../../../shared/interfaces/role-with-permissions';
import { IRole } from '../../../shared/interfaces/role';
import { IEmployeeWithRoles } from '../../../shared/interfaces/employee-with-roles';
import { IEmployee } from '../../../shared/interfaces/employee';
import { IClientDevice } from '../../../shared/interfaces/client-device';
import { ICreateEmployeeResult } from '../../../shared/interfaces/create-employee-result';
import { IRegisterClientDeviceResult } from '../register-client-device-result';

export class MSSqlDatabaseProvider implements DatabaseProvider {
    private config: ConnectionConfig;
    private dbHelper: DatabaseHelper;
    private logger: { log: Function, error: Function };

    initialize(obj: any, logger: any): void {
        this.logger = logger;
        this.config = <ConnectionConfig>(obj);
        this.dbHelper = new DatabaseHelper(this.config, this.logger);
    }

    async updateClientDevice(clientDevice: IClientDevice): Promise<void> {
        const sql = `
            UPDATE [ClientDevices]
            SET [Name]=@Name,
                [Address]=@Address,
                [Description]=@Description,
                [Approved]=@Approved
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', value: clientDevice.name, type: TYPES.NVarChar },
            { name: 'Address', value: clientDevice.address, type: TYPES.NVarChar },
            { name: 'Description', value: clientDevice.description, type: TYPES.NVarChar },
            { name: 'Approved', value: clientDevice.approved, type: TYPES.Bit },
            { name: 'Id', value: clientDevice.id, type: TYPES.NVarChar },
        ];
        await this.dbHelper.execRowCount(sql, params);
    }

    async approveClientDevice(clientDevice: IClientDevice): Promise<void> {
        const sql = `
            UPDATE [ClientDevices]
            SET [Name]=@Name,
                [Approved]=@Approved,
                [ApprovedAt]=@ApprovedAt
            WHERE [Id]=@Id
        `;
        const params: IRequestParameter[] = [
            { name: 'Name', value: clientDevice.name, type: TYPES.NVarChar },
            { name: 'Approved', value: 1, type: TYPES.Bit },
            { name: 'ApprovedAt', value: new Date().getTime(), type: TYPES.BigInt },
            { name: 'Id', value: clientDevice.id, type: TYPES.NVarChar }
        ];
        await this.dbHelper.execRowCount(sql, params);
    }

    async registerClientDevice(id: string, name: string, address: string): Promise<IRegisterClientDeviceResult> {
        const sql = `
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
            BEGIN TRANSACTION

            IF EXISTS (
                SELECT TOP 1 [Id] FROM [ClientDevices]
                WHERE [Id]=@Id
            )
                BEGIN
                    SELECT [CreatedNew]=CAST(0 AS bit)
                END
                ELSE
                BEGIN
                    SELECT [CreatedNew]=CAST(1 AS bit)
                    INSERT INTO [ClientDevices]
                    ([Id], [Name], [Address], [Approved]) VALUES
                    (@Id, @Name, @Address, 0)
                END

            SELECT TOP 1 [Id], [Name], [Address], [Description], [Approved], [ApprovedAt]
            FROM [ClientDevices]
            WHERE [Id]=@Id

            COMMIT TRANSACTION
        `;
        const params: IRequestParameter[] = [
            { name: 'Id', value: id, type: TYPES.NVarChar },
            { name: 'Name', value: name, type: TYPES.NVarChar },
            { name: 'Address', value: address, type: TYPES.NVarChar }
        ];
        const registerDeviceResult = await this.dbHelper.execToObjects(sql, params);
        const createdNew = (<{ createdNew: boolean }>registerDeviceResult.firstResultSet.rows[0]).createdNew;
        const device = <IClientDevice>registerDeviceResult.allResultSets[1].rows[0];
        const result = <IRegisterClientDeviceResult>{
            clientDevice: device,
            createdNew: createdNew
        };
        return result;
    }

    async getClientDevices(): Promise<IClientDevice[]> {
        const sql = `
            SELECT [Id], [Name], [Address], [Description], [Approved], [ApprovedAt]
            FROM [ClientDevices]
            ORDER BY [Name]
        `;
        const getResult = await this.dbHelper.execToObjects(sql);
        return <IClientDevice[]>getResult.firstResultSet.rows;
    }

    async createEmployeeWithRoles(employeeWithRoles: IEmployeeWithRoles): Promise<ICreateEmployeeResult> {
        let newId = this.dbHelper.generateId();
        let sql = `
            SET TRANSACTION ISOLATION LEVEL SERIALIZABLE
            BEGIN TRANSACTION

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
            COMMIT TRANSACTION
        `;
        const insertResult = await this.dbHelper.execToObjects(sql, params);
        const alreadyExists = (<{ alreadyExists: boolean }>insertResult.firstResultSet.rows[0]).alreadyExists;
        if (alreadyExists) {
            newId = '';
        }
        return { createdId: newId, alreadyExists: alreadyExists };
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
        // TODO Return only ids of roles, not entire role object
        const sql = `
            SELECT e.[Id], e.[Username], e.[FirstName], e.[LastName], e.[Email], e.[Disabled],
                   r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS [RoleDescription]
            FROM [Employees] e
            LEFT OUTER JOIN [EmployeesInRoles] eir ON eir.[EmployeeId] = e.[Id]
            LEFT OUTER JOIN [Roles] r ON r.[Id] = eir.[RoleId]
            ORDER BY [Username]
        `;
        const employeeWithRolesResult = await this.dbHelper.execToObjects(sql);
        const keyObject = { id: '', username: '', firstName: '', lastName: '', email: '', disabled: false };
        const grouped = this.dbHelper.groupByProperties(employeeWithRolesResult.firstResultSet.rows, keyObject);
        const employeesWithRoles = this.compileEmployeesWithRoles(grouped);
        // Remove roles with id=null
        employeesWithRoles.forEach(x => x.roles = x.roles.filter(y => y.id));
        return employeesWithRoles;
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

    // async getEmployees(): Promise<IEmployeeWithRoles[]> {
    //     const sql = `
    //         SELECT [Id], [Username], [FirstName], [LastName], [Email], [Disabled]
    //         FROM [Employees]
    //         ORDER BY [FirstName], [LastName]
    //     `;
    //     const employeesResult = await this.dbHelper.execToObjects(sql);
    //     return <IEmployeeWithRoles[]>employeesResult.firstResultSet.rows;
    // }

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
        const keyObject = { roleId: '', roleName: '', roleDescription: '' };
        const grouped = this.dbHelper.groupByProperties(rolesWithPermissionsResult.firstResultSet.rows, keyObject);
        const rolesWithPermissions = this.compileRolesWithPermissions(grouped);
        return Promise.resolve(<IEmployeeWithRolesAndPermissions>{
            employee: employee,
            rolesWithPermissions: rolesWithPermissions
        });
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

    async createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult> {
        return this.dbHelper.createDatabase(administratorPassword);
    }

    async prepareDatabase(): Promise<IPrepareDatabaseResult> {
        return this.dbHelper.prepareDatabase();
    }

    private compileEmployeesWithRoles(grouped: IGroup[]): IEmployeeWithRoles[] {
        const result: IEmployeeWithRoles[] = [];
        for (let i = 0; i < grouped.length; i++) {
            const grp = grouped[i];
            const grpEmployee = <IEmployee>grp.key;
            const employeeWithRoles = <IEmployeeWithRoles>{ employee: grpEmployee, roles: [] };
            for (let j = 0; j < grp.items.length; j++) {
                const grpRole = grp.items[j] as { roleId: string, roleName: string, roleDescription: string };
                const role: IRole = {
                    id: grpRole.roleId,
                    name: grpRole.roleName,
                    description: grpRole.roleDescription
                };
                employeeWithRoles.roles.push(role);
            }
            result.push(employeeWithRoles);
        }
        return result;
    }

    private compileRolesWithPermissions(grouped: IGroup[]): IRoleWithPermissions[] {
        const rolesWithPermissions: IRoleWithPermissions[] = [];
        for (let i = 0; i < grouped.length; i++) {
            const grp = grouped[i];
            const grpRole = grp.key as { roleId: string, roleName: string, roleDescription: string };
            const role: IRole = {
                id: grpRole.roleId,
                name: grpRole.roleName,
                description: grpRole.roleDescription
            };
            const roleWithPermissions = <IRoleWithPermissions>{};
            roleWithPermissions.role = role;
            roleWithPermissions.permissions = [];
            for (let j = 0; j < grp.items.length; j++) {
                const grpPermission = grp.items[j] as { permissionId: string, permissionName: string, permissionDescription: string };
                const permission: IPermission = {
                    id: grpPermission.permissionId,
                    name: grpPermission.permissionName,
                    description: grpPermission.permissionDescription
                };
                roleWithPermissions.permissions.push(permission);
            }
            rolesWithPermissions.push(roleWithPermissions);
        }
        return rolesWithPermissions;
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
