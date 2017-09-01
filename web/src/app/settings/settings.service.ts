import { Injectable } from '@angular/core';

import { DataService } from '../core/data.sevice';
import { CacheService } from '../core/cache.service';
import { IEmployee } from '../../../../shared/interfaces/employee';

@Injectable()
export class SettingsService {
    constructor(private dataSvc: DataService, private cacheSvc: CacheService) { }

    getAllEmployees(): Promise<IEmployee[]> {
        return this.dataSvc.getAllEmployees().then((employees: IEmployee[]) => {
            return employees;
        });
    }

    updateEmployee(employee: IEmployee): Promise<void> {
        return this.dataSvc.updateEmployee(employee);
    }
}


