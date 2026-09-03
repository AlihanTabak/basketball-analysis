import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerComparison } from './player-comparison';

describe('PlayerComparison', () => {
  let component: PlayerComparison;
  let fixture: ComponentFixture<PlayerComparison>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerComparison]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerComparison);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
