import { uptime } from 'os';

export class Time {
    getCurrentTime(): number {
        return Date.now();
    }

    getCurrentUptime(): number {
        return Math.floor(uptime() * 1000);
    }
}
