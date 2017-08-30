import { Component, OnInit } from '@angular/core';

import { SettingsService } from './settings.service';

@Component({
    templateUrl: './settings-employees.html'
})
export class SettingsEmployeesComponent implements OnInit {
    constructor(private settingsSvc: SettingsService) { }

    ngOnInit() {
    }
}
