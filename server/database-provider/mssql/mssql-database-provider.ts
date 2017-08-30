import * as crypto from 'crypto';
import { ConnectionConfig, TYPES } from 'tedious';

import { DatabaseProvider } from '../database-provider';
import { IPrepareDatabaseResult } from '../prepare-database-result';
import { ICreateDatabaseResult } from '../create-database-result';
import { DatabaseHelper, IRequestParameter } from './database-helper';
import { IEmployee } from '../../shared/interfaces/employee';
import { IPermission } from '../../shared/interfaces/permission';
import { IEmployeeWithPermissions } from '../../shared/interfaces/employee-with-permissions';

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

    async getEmployeeWithPermissions(username: string, password: string): Promise<IEmployeeWithPermissions> {
        // First get employee
        const employee = await this.getEmployeeByUsernameAndPassword(username, password);
        if (!employee) {
            // Such employee is not found - return empty result
            return Promise.resolve(<IEmployeeWithPermissions>{});
        }
        // Now get user permissions
        const userPermissionsSql = `
            SELECT ep.[PermissionId], p.[Name], p.[Description]
            FROM [Employees] e
            LEFT OUTER JOIN [EmployeesPermissions] ep
            ON ep.[EmployeeId] = e.[Id]
            INNER JOIN [Permissions] p
            ON p.[Id] = ep.[PermissionId]
            WHERE e.[Id] = @EmployeeId
        `;
        const userWithPermissionsParams: IRequestParameter[] = [
            { name: 'EmployeeId', value: employee.id, type: TYPES.NVarChar }
        ];
        const permissionsData = await this.dbHelper.execToObjects(userPermissionsSql, userWithPermissionsParams);
        const permissions: IPermission[] = [];
        for (let i = 0; i < permissionsData.length; i++) {
            const permissionData = <{ permissionId: string, name: string, description: string }>permissionsData[i];
            permissions.push({ id: permissionData.permissionId, name: permissionData.name, description: permissionData.description });
        }
        return Promise.resolve(<IEmployeeWithPermissions>{ employee: employee, permissions: permissions });
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
