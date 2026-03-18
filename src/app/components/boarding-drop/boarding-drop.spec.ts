import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardingDrop } from './boarding-drop';

describe('BoardingDrop', () => {
  let component: BoardingDrop;
  let fixture: ComponentFixture<BoardingDrop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardingDrop],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardingDrop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
