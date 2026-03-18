import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortBar } from './sort-bar';

describe('SortBar', () => {
  let component: SortBar;
  let fixture: ComponentFixture<SortBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortBar],
    }).compileComponents();

    fixture = TestBed.createComponent(SortBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
