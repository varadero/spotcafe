import { Injectable } from '@angular/core';

import { DataService } from '../core/data.sevice';
import { CacheService } from '../core/cache.service';
import { IEmployee } from '../../../../shared/interfaces/employee';

@Injectable()
export class SettingsService {
    constructor(private dataSvc: DataService, private cacheSvc: CacheService) { }

    getAllEmployees(): Promise<IEmployee[]> {
        const existing = this.cacheSvc.getAllEmployees();
        if (existing) {
            return Promise.resolve(existing);
        }

        return this.dataSvc.getAllEmployees().then(x => {
            return x;
        });
    }
}


