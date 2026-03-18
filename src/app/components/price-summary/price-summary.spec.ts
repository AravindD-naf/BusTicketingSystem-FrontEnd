import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceSummary } from './price-summary';

describe('PriceSummary', () => {
  let component: PriceSummary;
  let fixture: ComponentFixture<PriceSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
