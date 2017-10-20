import { TYPES } from 'tedious';

import { DatabaseHelper, IRequestParameter } from './database-helper';
import { IReportTotalsByEntity } from '../../../shared/interfaces/report-totals-by-entity';

export class ReportsHelper {
    constructor(private dbHelper: DatabaseHelper) {
    }

    async totalsByDevice(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT cd.[Name], SUM(cdsh.[Bill]) AS [Total]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [ClientDevices] cd ON cdsh.[DeviceId]=cd.[Id]
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY cd.[Name]
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        return <IReportTotalsByEntity[]>result.firstResultSet.rows;
    }

    async totalsByClient(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT c.[Username], SUM(cdsh.Bill) AS [Total]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [Clients] c ON cdsh.[StartedByClientId]=c.[Id]
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY c.[Username]
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        const renamed = this.toReporTotalsByEntity(result.firstResultSet.rows);
        return renamed;
    }

    async totalsByEmployee(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT e.[Username], SUM(cdsh.Bill) AS [Total]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [Employees] e ON cdsh.[StartedByEmployeeId]=e.Id
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY e.[Username]
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        const renamed = this.toReporTotalsByEntity(result.firstResultSet.rows);
        return renamed;
    }

    private toReporTotalsByEntity(objects: any[]): IReportTotalsByEntity[] {
        const mapObject = { username: 'name', total: '' };
        const renamed = <IReportTotalsByEntity[]>this.dbHelper.mapToObjects(objects, mapObject);
        return renamed;
    }
}
