import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusCard } from './bus-card';

describe('BusCard', () => {
  let component: BusCard;
  let fixture: ComponentFixture<BusCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusCard],
    }).compileComponents();

    fixture = TestBed.createComponent(BusCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
