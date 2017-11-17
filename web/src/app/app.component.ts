import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DataService } from './core/data.service';
import { AuthService } from './core/auth.service';
import { WebSocketService, IWebSocketEventArgs } from './core/web-socket.service';
import { IToken } from '../../../shared/interfaces/token';
import { MessagesService } from './shared/messages.service';

@Component({
  selector: 'spotcafe-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean;
  sidenavCollapsed = true;

  private wsAddr: string;
  private wsEvents: Observable<IWebSocketEventArgs>;

  constructor(
    private dataSvc: DataService,
    private authSvc: AuthService,
    private wsSvc: WebSocketService,
    private msgSvc: MessagesService) {
    this.wsAddr = this.getWebSocketAddress();
  }

  ngOnInit(): void {
    this.authSvc.loggedIn$.subscribe(token => {
      if (token) {
        setTimeout(() =>
          this.msgSvc.addSuccessMessage(`Succesfully logged in`)
        );
      }
      this.handleLoggedIn(token);
    });
    this.authSvc.unauthorized$.subscribe(() => {
      this.msgSvc.addErrorMessage('Not authorized');
    });
    this.authSvc.unauthenticated$.subscribe(() => {
      this.msgSvc.addErrorMessage('Not authenticated. You need to log in');
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
      this.closeWebSocketService();
      this.wsSvc.connect(this.wsAddr, token.token, true, false);
      this.wsEvents = this.wsSvc.getSubject();
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

  private closeWebSocketService(): void {
    this.wsSvc.close();
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
