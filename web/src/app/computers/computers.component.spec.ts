import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComputersComponent } from './computers.component';

describe('ComputersComponent', () => {
  let component: ComputersComponent;
  let fixture: ComponentFixture<ComputersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComputersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComputersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
