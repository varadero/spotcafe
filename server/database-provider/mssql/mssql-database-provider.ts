import * as crypto from 'crypto';
import { ConnectionConfig, TYPES } from 'tedious';

import { DatabaseProvider } from '../database-provider';
import { IPrepareDatabaseResult } from '../prepare-database-result';
import { ICreateDatabaseResult } from '../create-database-result';
import { DatabaseHelper, IRequestParameter } from './database-helper';
import { IEmployee } from '../../../shared/interfaces/employee';
import { IPermission } from '../../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../../shared/interfaces/employee-with-roles-and-permissions';
import { IRoleWithPermisions } from '../../../shared/interfaces/role-with-permissions';

export class MSSqlDatabaseProvider implements DatabaseProvider {
    private config: ConnectionConfig;
    private dbHelper: DatabaseHelper;

    initialize(obj: any): void {
        this.config = <ConnectionConfig>(obj);
        this.dbHelper = new DatabaseHelper(this.config);
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
        // Now get user permissions
        const employeeRolesWithPermissionsSql = `
            SELECT r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS RoleDescription,
            p.[Id] AS [PermissionId], p.[Name] AS [PermissionName], p.[Description] AS PermissionDescription
            FROM [Roles] r
            INNER JOIN [EmployeesInRoles] eir ON eir.[RoleId] = r.[Id]
            INNER JOIN [PermissionsInRoles] pir ON pir.[RoleId] = r.[Id]
            INNER JOIN [Permissions] p ON p.[Id] = pir.[PermissionId]
            WHERE eir.[EmployeeId] = @EmployeeId

            SELECT * FROM [Employees]
        `;
        const userWithPermissionsParams: IRequestParameter[] = [
            { name: 'EmployeeId', value: employee.id, type: TYPES.NVarChar }
        ];
        const rolesWithPermissionsData = await this.dbHelper.execToObjects(employeeRolesWithPermissionsSql, userWithPermissionsParams);
        const rolesWithPermissions: IRoleWithPermisions[] = [];
        rolesWithPermissions.push(<any>null);
        for (let i = 0; i < rolesWithPermissionsData.length; i++) {
        }
        return Promise.resolve(<IEmployeeWithRolesAndPermissions>{ employee: employee, rolesWithPermissions: [] });
    }

    async getAllPermissions(): Promise<IPermission[]> {
        const sql = `
            SELECT [Id], [Name], [Description]
            FROM [Permissions]
            ORDER BY [Name]
        `;
        const permissions = await this.dbHelper.executeToObjects(null, sql);
        return permissions;
    }

    async createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult> {
        return this.dbHelper.createDatabase(administratorPassword);
    }

    async prepareDatabase(): Promise<IPrepareDatabaseResult> {
        return this.dbHelper.prepareDatabase();
    }

    private async getEmployeeByUsernameAndPassword(username: string, password: string): Promise<IEmployee | null> {
        const getEmployeeSql = `
            SELECT TOP 1 [Id], [Username], [Disabled]
            FROM [Employees]
            WHERE [Username]=@Username AND [Password]=@PasswordHash
        `;
        const passwordHash = this.getSha512(password);
        const params: IRequestParameter[] = [
            { name: 'Username', value: username, type: TYPES.NVarChar },
            { name: 'PasswordHash', value: passwordHash, type: TYPES.NVarChar }
        ];
        const employeeData = await this.dbHelper.execToObjects(getEmployeeSql, params);
        if (!employeeData.length) {
            return null;
        }
        return <IEmployee>employeeData[0];
    }

    private getSha512(value: string): string {
        const sha256 = crypto.createHash('sha512');
        const hash = sha256.update(value).digest('hex');
        return hash;
    }
}
