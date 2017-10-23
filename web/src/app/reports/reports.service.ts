import { IDateTimeSelectorModel } from '../shared/date-time-selector/date-time-selector.component';
import { IDateAndTime } from '../../../../shared/interfaces/date-and-time';

export class ReportsService {
    toDateTime(value: IDateTimeSelectorModel): IDateAndTime {
        const result = <IDateAndTime>{
            year: value.selectedYear.value,
            month: value.selectedMonth.value,
            day: value.selectedDay.value,
            minute: value.selectedHour.value
        };
        return result;
    }
}
