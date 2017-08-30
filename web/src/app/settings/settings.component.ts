import { Component, OnInit } from '@angular/core';

import { DataService } from '../core/data.sevice';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  constructor(private daaSvc: DataService) { }

  ngOnInit() {
  }
}
