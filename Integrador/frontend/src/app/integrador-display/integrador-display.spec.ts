import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegradorDisplay } from './integrador-display';

describe('IntegradorDisplay', () => {
  let component: IntegradorDisplay;
  let fixture: ComponentFixture<IntegradorDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegradorDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegradorDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
