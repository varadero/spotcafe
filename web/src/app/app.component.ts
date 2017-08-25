import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  sidenavCollapsed: boolean;

  ngOnInit(): void {
    this.sidenavCollapsed = false;
  }

  toggleSidenav(): void {
    this.sidenavCollapsed = !this.sidenavCollapsed;
  }
}
