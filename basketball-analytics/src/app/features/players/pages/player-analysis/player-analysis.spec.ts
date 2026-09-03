import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerAnalysis } from './player-analysis';

describe('PlayerAnalysis', () => {
  let component: PlayerAnalysis;
  let fixture: ComponentFixture<PlayerAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
