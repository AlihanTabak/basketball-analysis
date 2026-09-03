import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamAnalysis } from './team-analysis';

describe('TeamAnalysis', () => {
  let component: TeamAnalysis;
  let fixture: ComponentFixture<TeamAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
