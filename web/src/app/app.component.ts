import { Component, OnInit } from '@angular/core';

import { DataService } from './core/data.sevice';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  sidenavCollapsed: boolean;
  isLoggedIn: boolean;

  constructor(private dataSvc: DataService, private authSvc: AuthService) { }

  ngOnInit(): void {
    this.sidenavCollapsed = false;
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

  toggleSidenav(): void {
    this.sidenavCollapsed = !this.sidenavCollapsed;
  }
}
