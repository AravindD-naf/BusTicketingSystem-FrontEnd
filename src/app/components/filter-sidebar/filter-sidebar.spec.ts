import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSidebar } from './filter-sidebar';

describe('FilterSidebar', () => {
  let component: FilterSidebar;
  let fixture: ComponentFixture<FilterSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
