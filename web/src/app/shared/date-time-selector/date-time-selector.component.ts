import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'spotcafe-date-time-selector',
    templateUrl: './date-time-selector.component.html'
})
export class DateTimeSelectorComponent implements OnInit {
    @Input() value: IDateTimeSelectorModel;

    private defaultStartYear = 2017;
    private currentDate = new Date();

    ngOnInit(): void {
        this.prepareValue();
    }

    private createNewValue(): IDateTimeSelectorModel {
        const result = <IDateTimeSelectorModel>{};

        result.years = this.createYears();
        result.months = this.createMonths();
        result.days = this.createDays();
        result.hours = this.createHours();

        return result;
    }

    private createYears(): INameWithValue[] {
        const currentYear = (new Date()).getFullYear();
        const result: INameWithValue[] = [];
        for (let i = this.defaultStartYear; i <= currentYear; i++) {
            result.push({ name: i.toString(), value: i });
        }
        return result;
    }

    private createMonths(): INameWithValue[] {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const result = monthNames.map((x, i) => (<INameWithValue>{ name: x, value: i + 1 }));
        return result;
    }

    private createDays(): INameWithValue[] {
        const result: INameWithValue[] = [];
        for (let i = 1; i < 32; i++) {
            result.push({
                name: i.toString(),
                value: i
            });
        }
        return result;
    }

    private createHours(): INameWithValue[] {
        const result: INameWithValue[] = [];
        for (let i = 0; i < 24; i++) {
            const minutes = i * 60;
            result.push({
                name: this.minutesToHoursText(minutes),
                value: minutes
            });
        }
        return result;
    }

    private minutesToHoursText(minutes: number): string {
        // Support only whole hours
        const hours = minutes / 60;
        return `${hours}:00`;
    }

    private prepareValue(): void {
        if (!this.value) {
            this.value = this.createNewValue();
        }
        const value = this.value;

        if (!value.years) {
            value.years = this.createYears();
        }
        if (!value.selectedYear) {
            const currentYear = this.currentDate.getFullYear();
            value.selectedYear = value.years.find(x => x.value === currentYear) || value.years[0];
        }

        if (!value.months) {
            value.months = this.createMonths();
        }
        if (!value.selectedMonth) {
            const currentMonth = this.currentDate.getMonth() + 1;
            value.selectedMonth = value.months.find(x => x.value === currentMonth) || value.months[0];
        }

        if (!value.days) {
            value.days = this.createDays();
        }
        if (!value.selectedDay) {
            const currentDay = this.currentDate.getDate();
            value.selectedDay = value.days.find(x => x.value === currentDay) || value.days[0];
        }

        if (!value.hours) {
            value.hours = this.createHours();
        }
        if (!value.selectedHour) {
            value.selectedHour = value.hours[0];
        }
    }
}

export interface IDateTimeSelectorModel {
    years: INameWithValue[];
    selectedYear: INameWithValue;
    months: INameWithValue[];
    selectedMonth: INameWithValue;
    days: INameWithValue[];
    selectedDay: INameWithValue;
    hours: INameWithValue[];
    selectedHour: INameWithValue;
}

export interface INameWithValue {
    name: string;
    value: number;
}

