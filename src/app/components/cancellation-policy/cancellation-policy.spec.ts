import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancellationPolicy } from './cancellation-policy';

describe('CancellationPolicy', () => {
  let component: CancellationPolicy;
  let fixture: ComponentFixture<CancellationPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancellationPolicy],
    }).compileComponents();

    fixture = TestBed.createComponent(CancellationPolicy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
