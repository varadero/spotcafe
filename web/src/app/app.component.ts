import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DataService } from './core/data.service';
import { AuthService } from './core/auth.service';
import { WebSocketManager, IWebSocketEventArgs } from './core/web-socket-manager';
import { IToken } from '../../../shared/interfaces/token';

@Component({
  selector: 'spotcafe-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean;
  sidenavCollapsed = true;

  private wsAddr: string;
  private wsMan: WebSocketManager;
  private wsEvents: Observable<IWebSocketEventArgs>;

  constructor(private dataSvc: DataService, private authSvc: AuthService) {
    this.wsAddr = this.getWebSocketAddress();
  }

  ngOnInit(): void {
    this.authSvc.loggedIn$.subscribe(token => {
      this.handleLoggedIn(token);
    });
    this.authSvc.unauthorized$.subscribe(() => {
      // TODO Show toaster with unauthorized message
    });
  }

  logInEmployee(username: string, password: string) {
    this.dataSvc.logInEmployee(username, password).then(res => {
      this.authSvc.setLoggedIn(res);
    }, () => {
      this.authSvc.setUnauthenticated();
    });
  }

  private handleLoggedIn(token: IToken | null): void {
    this.isLoggedIn = !!token;
    if (token && this.isLoggedIn) {
      this.wsMan = this.createWebSocketManager();
      this.wsEvents = this.wsMan.connect(this.wsAddr, token.token, true, false);
      this.wsEvents.subscribe(data => {
        this.handleWebSocketData(data);
      });
    } else {

    }
  }

  private handleWebSocketData(data: IWebSocketEventArgs): void {
    if (data.name === 'close') {

    } else if (data.name === 'error') {

    } else if (data.name === 'message') {

    } else if (data.name === 'open') {

    }
  }

  private createWebSocketManager(): WebSocketManager {
    this.disposeWebSocketManager();
    const wsMan = new WebSocketManager();
    return wsMan;
  }

  private disposeWebSocketManager(): void {
    if (this.wsMan) {
      this.wsMan.close();
    }
  }

  private getWebSocketAddress(): string {
    let wssAddress = 'wss://' + window.location.host;
    if (window.location.port) {
      wssAddress += ':' + window.location.port;
    }
    wssAddress += '/api/websocket';
    return wssAddress;
  }
}
