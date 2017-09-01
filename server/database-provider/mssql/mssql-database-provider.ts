import * as crypto from 'crypto';
import { ConnectionConfig, TYPES } from 'tedious';

import { DatabaseProvider } from '../database-provider';
import { IPrepareDatabaseResult } from '../prepare-database-result';
import { ICreateDatabaseResult } from '../create-database-result';
import { DatabaseHelper, IRequestParameter, IGroup } from './database-helper';
import { IEmployee } from '../../../shared/interfaces/employee';
import { IPermission } from '../../../shared/interfaces/permission';
import { IEmployeeWithRolesAndPermissions } from '../../../shared/interfaces/employee-with-roles-and-permissions';
import { IRoleWithPermissions } from '../../../shared/interfaces/role-with-permissions';
import { IRole } from '../../../shared/interfaces/role';

export class MSSqlDatabaseProvider implements DatabaseProvider {
    private config: ConnectionConfig;
    private dbHelper: DatabaseHelper;
    private logger: { log: Function, error: Function };

    initialize(obj: any, logger: any): void {
        this.logger = logger;
        this.config = <ConnectionConfig>(obj);
        this.dbHelper = new DatabaseHelper(this.config, this.logger);
    }

    async getEmployeePermissionsIds(employeeId: string): Promise<string[]> {
        const getEmployeePermissionsSql = `
            SELECT p.[Id]
            FROM [Permissions] p
            INNER JOIN [PermissionsInRoles] pir ON pir.[PermissionId] = p.[Id]
            INNER JOIN [EmployeesInRoles] eir ON eir.[RoleId] = pir.[RoleId]
            WHERE eir.[EmployeeId] = @EmployeeId
        `;
        const params: IRequestParameter[] = [
            { name: 'EmployeeId', value: employeeId, type: TYPES.UniqueIdentifierN }
        ];
        const employeepermissionsResult = await this.dbHelper.execToObjects(getEmployeePermissionsSql, params);
        this.logger.log(employeepermissionsResult.firstResultSet.rows);
        return <string[]>employeepermissionsResult.firstResultSet.rows;
    }

    async getEmployees(): Promise<IEmployee[]> {
        const getEmployeesSql = `
            SELECT [Id], [Username], [FirstName], [LastName], [Email], [Disabled]
            FROM [Employees]
            ORDER BY [FirstName], [LastName]
        `;
        const employeesResult = await this.dbHelper.execToObjects(getEmployeesSql);
        return <IEmployee[]>employeesResult.firstResultSet.rows;
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
        const employeeRolesWithPermissionsSql = `
            SELECT r.[Id] AS [RoleId], r.[Name] AS [RoleName], r.[Description] AS RoleDescription,
            p.[Id] AS [PermissionId], p.[Name] AS [PermissionName], p.[Description] AS PermissionDescription
            FROM [Roles] r
            INNER JOIN [EmployeesInRoles] eir ON eir.[RoleId] = r.[Id]
            INNER JOIN [PermissionsInRoles] pir ON pir.[RoleId] = r.[Id]
            INNER JOIN [Permissions] p ON p.[Id] = pir.[PermissionId]
            WHERE eir.[EmployeeId] = @EmployeeId
        `;
        const userWithPermissionsParams: IRequestParameter[] = [
            { name: 'EmployeeId', value: employee.id, type: TYPES.NVarChar }
        ];
        const rolesWithPermissionsResult = await this.dbHelper.execToObjects(employeeRolesWithPermissionsSql, userWithPermissionsParams);
        const keyObject = { roleId: '', roleName: '', roleDescription: '' };
        const grouped = this.dbHelper.groupByProperties(rolesWithPermissionsResult.firstResultSet.rows, keyObject);
        const rolesWithPermissions = this.compileRolesWithPermissions(grouped);
        return Promise.resolve(<IEmployeeWithRolesAndPermissions>{
            employee: employee,
            rolesWithPermissions: rolesWithPermissions
        });
    }

    async getAllPermissions(): Promise<IPermission[]> {
        const sql = `
            SELECT [Id], [Name], [Description]
            FROM [Permissions]
            ORDER BY [Name]
        `;
        const permissions = await this.dbHelper.executeToObjects(null, sql);
        return permissions.firstResultSet.rows;
    }

    async createDatabase(administratorPassword: string): Promise<ICreateDatabaseResult> {
        return this.dbHelper.createDatabase(administratorPassword);
    }

    async prepareDatabase(): Promise<IPrepareDatabaseResult> {
        return this.dbHelper.prepareDatabase();
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
        if (!employeeData.firstResultSet.rows.length) {
            return null;
        }
        return <IEmployee>employeeData.firstResultSet.rows[0];
    }

    private getSha512(value: string): string {
        const sha256 = crypto.createHash('sha512');
        const hash = sha256.update(value).digest('hex');
        return hash;
    }
}
