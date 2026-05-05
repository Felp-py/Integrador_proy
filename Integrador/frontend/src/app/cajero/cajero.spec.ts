import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cajero } from './cajero';

describe('Cajero', () => {
  let component: Cajero;
  let fixture: ComponentFixture<Cajero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cajero],
    }).compileComponents();

    fixture = TestBed.createComponent(Cajero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
