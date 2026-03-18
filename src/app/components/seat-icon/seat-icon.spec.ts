import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatIcon } from './seat-icon';

describe('SeatIcon', () => {
  let component: SeatIcon;
  let fixture: ComponentFixture<SeatIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
