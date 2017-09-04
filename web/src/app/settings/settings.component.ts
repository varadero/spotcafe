import { Component, OnInit } from '@angular/core';

import { DataService } from '../core/data.sevice';

@Component({
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {

  constructor(private daaSvc: DataService) { }

  ngOnInit() {
  }
}
