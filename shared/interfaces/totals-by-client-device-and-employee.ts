import { IReportTotalsByEntity } from './report-totals-by-entity';

export interface ITotalsByClientDeviceAndEmployee {
    clients: IReportTotalsByEntity[];
    devices: IReportTotalsByEntity[];
    employees: IReportTotalsByEntity[];
    totalForPeriod: number;
}
