import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromoCard } from './promo-card';

describe('PromoCard', () => {
  let component: PromoCard;
  let fixture: ComponentFixture<PromoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
