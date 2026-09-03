import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerShotAnalysis } from './player-shot-analysis';

describe('PlayerShotAnalysis', () => {
  let component: PlayerShotAnalysis;
  let fixture: ComponentFixture<PlayerShotAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerShotAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerShotAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
