import { IEmployee } from '../../../../shared/interfaces/employee';

export class CacheService {
    // 60 seconds expiration
    private expirationDuration = 60000;
    private cachedItems = new Map<string, any>();

    getAllEmployees(): IEmployee[] {
        return this.getItem<IEmployee[]>('allEmployees');
    }

    seItem<T>(key: string, item: T) {
        const cachedAt = new Date().getTime();
        this.cachedItems.set(key, <ICacheItem<T>>{ key: key, item: item, cachedAt: cachedAt });
    }

    getItem<T>(key: string): T | undefined {
        const cacheItem = <ICacheItem<T>>this.cachedItems.get(key);
        if (!cacheItem) {
            return undefined;
        }
        // Check if expired
        const currentUtcTime = new Date().getTime();
        if (currentUtcTime > (cacheItem.cachedAt + this.expirationDuration)) {
            this.cachedItems.delete(key);
            return undefined;
        }
        return cacheItem.item;
    }
}

interface ICacheItem<T> {
    key: string;
    item: T;
    cachedAt: number;
}
