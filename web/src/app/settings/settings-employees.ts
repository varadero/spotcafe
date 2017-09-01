import { Component, OnInit } from '@angular/core';

import { SettingsService } from './settings.service';
import { IEmployee } from '../../../../shared/interfaces/employee';

@Component({
    templateUrl: './settings-employees.html'
})
export class SettingsEmployeesComponent implements OnInit {
    selectedEmployee: IEmployee;

    private employees: IEmployee[];

    constructor(private settingsSvc: SettingsService) { }

    ngOnInit() {
        this.getAllEmployees();
    }

    getAllEmployees() {
        this.settingsSvc.getAllEmployees().then(x => {
            this.employees = x;
        }, err => {
            // TODO Show error
        });
    }

    updateEmployee(employee: IEmployee) {
        if (!employee) {
            return;
        }
        this.settingsSvc.updateEmployee(this.selectedEmployee).then(x => {
        }, err => {
        });
    }
}
