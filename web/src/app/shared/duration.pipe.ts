import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
    transform(value: number): string {
        const result = this.millisecondsToDisplayText(value);
        return result;
    }

    private millisecondsToDisplayText(value: number): string {
        if (!value) {
            return '';
        }
        const millisecondsRoundedToNearestSecond = 1000 * Math.round(value / 1000);
        const totalSeconds = Math.floor(millisecondsRoundedToNearestSecond / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
        const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60);

        const minutesPrefix = (minutes < 10) ? '0' : '';
        const secondsPrefix = (seconds < 10) ? '0' : '';

        return `${hours}:${minutesPrefix}${minutes}:${secondsPrefix}${seconds}`;
    }
}
