import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
    transform(value: number): string {
        return value ? value.toFixed(2) : '0.00';
    }
}
