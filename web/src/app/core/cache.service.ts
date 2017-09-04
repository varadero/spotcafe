import { Injectable } from '@angular/core';

@Injectable()
export class CacheService {
    // 60 seconds expiration
    private expirationDuration = 60000;
    private cachedItems = new Map<string, any>();

    setItem<T>(key: string, item: T): void {
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

    removeItem(key: string): void {
        this.cachedItems.delete(key);
    }
}

interface ICacheItem<T> {
    key: string;
    item: T;
    cachedAt: number;
}
