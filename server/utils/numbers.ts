export class Numbers {
    stringToNumber(value: string): number {
        if (!value) {
            return NaN;
        }
        const firstDigitPosition = value.search(/\d/g);
        if (firstDigitPosition === -1) {
            // No digits found
            return NaN;
        }
        for (const item of value) {
            if (!this.isCharAllowedInNumbers(item)) {
                // Not allowed character found
                return NaN;
            }
        }
        // Leave only digits and possible thousand and decimal separators
        let stripped = '';
        for (const item of value) {
            if ((item >= '0' && item <= '9') || item === ',' || item === '.') {
                stripped += item;
            }
        }
        if (!stripped) {
            // Empty string - no digits or separators
            return NaN;
        }

        // Find right most separator
        const rightMostPointPosition = stripped.lastIndexOf('.');
        const rightMostCommaPosition = stripped.lastIndexOf(',');
        const rightMostSeparatorPosition = Math.max(rightMostPointPosition, rightMostCommaPosition);
        // Remove all separators
        const digitsOnly = stripped.replace(/,/g, '').replace(/\./g, '');
        // Convert tu number - it will be eventually divided accordin to separator position
        const num = parseInt(digitsOnly, 10);
        let divider = 1;
        if (rightMostSeparatorPosition === -1) {
            // No separator found - only digits exist
            return parseInt(stripped, 10);
        } else {
            if (rightMostSeparatorPosition === stripped.length - 2) {
                // Separator is at the second to last position - divide by 10
                divider = 10;
            } else if (rightMostSeparatorPosition === stripped.length - 3) {
                // Separator is at the third position from the end - multiply by 100
                divider = 100;
            }
        }
        return num / divider;
    }

    private isCharAllowedInNumbers(value: string): boolean {
        return (value === ' ' || value === ',' || value === '.' || (value >= '0' && value <= '9'));
    }
}
