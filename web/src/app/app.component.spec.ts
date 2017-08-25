import { TestBed, async } from '@angular/core/testing';

import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';
import { ComponentFixture } from '@angular/core/testing';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  }));
  describe('controller', () => {
    describe('initialization', () => {
      it('should create the app', async(() => {
        const app = getComponent();
        expect(app).toBeTruthy();
      }));

      it('should set value sidenavCollapsed to false', async(() => {
        const app = getComponent();
        expect(app.sidenavCollapsed).toBe(false, 'initially sidenav should be expaneded');
      }));
    });

    describe('toggle sidenav', () => {
      it('should toggle sidenav visibility "expanded" -> "collapsed" -> "expanded"...', async(() => {
        const app = getComponent();

        app.toggleSidenav();
        expect(app.sidenavCollapsed).toBe(true, 'should toggle sidenav from "expanded" to "collapsed"');

        app.toggleSidenav();
        expect(app.sidenavCollapsed).toBe(false, 'should toggle sidenav from "collapsed" to "expanded"');
      }));
    });
  });

  describe('template', () => {
    it('should set "sidenav-expanded" class to md-sidenav on initialization', async(() => {
      const { app, fixture } = getComponentWithFixture();
      fixture.detectChanges();
    }));
  });


  // it(`should have as title 'app'`, async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   expect(app.title).toEqual('app', 'needs title property in controller');
  // }));

  // it('should render title in a h1 tag', async(() => {
  //   const fixture = TestBed.createComponent(AppComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
  // }));

  function getComponent(): AppComponent {
    const fixture = TestBed.createComponent(AppComponent);
    const app = <AppComponent>fixture.debugElement.componentInstance;
    app.ngOnInit();
    return app;
  }

  function getComponentWithFixture(): { app: AppComponent, fixture: ComponentFixture<AppComponent> } {
    const fixture = TestBed.createComponent(AppComponent);
    const app = <AppComponent>fixture.debugElement.componentInstance;
    app.ngOnInit();
    return { app, fixture };
  }
});
