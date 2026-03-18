import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatLegend } from './seat-legend';

describe('SeatLegend', () => {
  let component: SeatLegend;
  let fixture: ComponentFixture<SeatLegend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatLegend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatLegend);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
