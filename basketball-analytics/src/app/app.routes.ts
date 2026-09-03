import { Routes } from '@angular/router';

import { PlayerAnalysis } from './features/players/pages/player-analysis/player-analysis';
import { PlayerComparison } from './features/players/pages/player-comparison/player-comparison';
import { TeamAnalysis } from './features/teams/pages/team-analysis/team-analysis';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'player/608816',
    pathMatch: 'full'
  },
  {
    path: 'player/:id',
    component: PlayerAnalysis
  },
  {
    path: 'compare',
    component: PlayerComparison
  },
  {
    path: 'team/:teamId',
    component: TeamAnalysis
}
];