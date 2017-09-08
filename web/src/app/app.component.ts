import { Component, OnInit } from '@angular/core';

import { DataService } from './core/data.sevice';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'spotcafe-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean;
  sidenavCollapsed = true;

  constructor(private dataSvc: DataService, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.authSvc.loggedIn$.subscribe(token => {
      this.isLoggedIn = !!token;
    });
    this.authSvc.unauthorized$.subscribe(url => {
      // TODO Show toaster with unauthorized mesage
    });
  }

  logInEmployee(username: string, password: string) {
    this.dataSvc.logInEmployee(username, password).then(res => {
      this.authSvc.setLoggedIn(res);
    }, err => {
      this.authSvc.setUnauthenticated();
    });
  }
}
