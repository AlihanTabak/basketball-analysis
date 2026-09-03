import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamShotAnalysis } from './team-shot-analysis';

describe('TeamShotAnalysis', () => {
  let component: TeamShotAnalysis;
  let fixture: ComponentFixture<TeamShotAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamShotAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamShotAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
