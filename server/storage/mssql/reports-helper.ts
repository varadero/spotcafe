import { TYPES } from 'tedious';

import { DatabaseHelper, IRequestParameter } from './database-helper';
import { IReportTotalsByEntity } from '../../../shared/interfaces/report-totals-by-entity';

export class ReportsHelper {
    constructor(private dbHelper: DatabaseHelper) {
    }

    async totalForPeriod(startedAt: number, stoppedAt: number): Promise<number> {
        const sql = `
            SELECT SUM([Bill])
            FROM [ClientDevicesStatusHistory]
            WHERE [StartedAt]>=@StartedAt AND [StoppedAt]<=@StoppedAt
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execScalar(sql, params);
        return <number>result.value;
    }

    async totalsByDevice(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT cd.[Name],
                   SUM(cdsh.[Bill]) AS [Total],
                   SUM(cdsh.[StoppedAt]-cdsh.[StartedAt]) AS [TotalTimeByDateDiff],
                   SUM(cdsh.[StoppedAtUptime]-cdsh.[StartedAtUptime]) AS [TotalTimeByUptimeDiff],
                   COUNT(*) AS [TotalCount]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [ClientDevices] cd ON cdsh.[DeviceId]=cd.[Id]
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY cd.[Name]
            ORDER BY [Total] DESC
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        const renamed = this.toReportTotalsByEntity(result.firstResultSet.rows);
        return renamed;
    }

    async totalsByClient(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT c.[Username] AS [Name],
                   SUM(cdsh.[Bill]) AS [Total],
                   SUM(cdsh.[StoppedAt]-cdsh.[StartedAt]) AS [TotalTimeByDateDiff],
                   SUM(cdsh.[StoppedAtUptime]-cdsh.[StartedAtUptime]) AS [TotalTimeByUptimeDiff],
                   COUNT(*) AS [TotalCount]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [Clients] c ON cdsh.[StartedByClientId]=c.[Id]
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY c.[Username]
            ORDER BY [Total] DESC
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        const renamed = this.toReportTotalsByEntity(result.firstResultSet.rows);
        return renamed;
    }

    async totalsByEmployee(startedAt: number, stoppedAt: number): Promise<IReportTotalsByEntity[]> {
        const sql = `
            SELECT e.[Username] AS [Name],
                   SUM(cdsh.[Bill]) AS [Total],
                   SUM(cdsh.[StoppedAt]-cdsh.[StartedAt]) AS [TotalTimeByDateDiff],
                   SUM(cdsh.[StoppedAtUptime]-cdsh.[StartedAtUptime]) AS [TotalTimeByUptimeDiff],
                   COUNT(*) AS [TotalCount]
            FROM [ClientDevicesStatusHistory] cdsh
            INNER JOIN [Employees] e ON cdsh.[StartedByEmployeeId]=e.Id
            WHERE cdsh.[StartedAt]>=@StartedAt AND cdsh.[StoppedAt]<=@StoppedAt
            GROUP BY e.[Username]
            ORDER BY [Total] DESC
        `;
        const params: IRequestParameter[] = [
            { name: 'StartedAt', value: startedAt, type: TYPES.Decimal },
            { name: 'StoppedAt', value: stoppedAt, type: TYPES.Decimal }
        ];
        const result = await this.dbHelper.execToObjects(sql, params);
        const renamed = this.toReportTotalsByEntity(result.firstResultSet.rows);
        return renamed;
    }

    private toReportTotalsByEntity(objects: any[]): IReportTotalsByEntity[] {
        const result = this.selectTotalTime(<IReportRoralsByEntityWithTotalsBy[]>objects);
        return result;
    }

    private selectTotalTime(totalsByEntity: IReportRoralsByEntityWithTotalsBy[]): IReportTotalsByEntity[] {
        const result: IReportTotalsByEntity[] = [];
        for (let i = 0; i < totalsByEntity.length; i++) {
            const item = totalsByEntity[i];
            const totalTime = Math.max(item.totalTimeByDateDiff, item.totalTimeByUptimeDiff);
            result.push({
                name: item.name,
                total: item.total,
                totalTime: totalTime,
                totalCount: item.totalCount
            });
        }
        return result;
    }
}

interface IReportRoralsByEntityWithTotalsBy extends IReportTotalsByEntity {
    totalTimeByDateDiff: number;
    totalTimeByUptimeDiff: number;
}
