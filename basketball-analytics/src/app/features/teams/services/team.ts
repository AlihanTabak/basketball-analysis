import {
  inject,
  Injectable
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


/* =========================================================
   GENERAL TEAM ANALYSIS
   ========================================================= */

export interface TeamRecord {
  games: number;
  wins: number;
  losses: number;
}


export interface TeamStats {
  ppg: number | null;

  two_pct: number | null;
  three_pct: number | null;
  ft_pct: number | null;

  rebounds_pg: number | null;
  assists_pg: number | null;
  steals_pg: number | null;
  turnovers_pg: number | null;
  blocks_pg: number | null;

  efficiency_pg: number | null;
}


export interface TeamRosterPlayer {
  player_id: number;
  player_name: string;

  games: number | null;
  average_minutes: number | null;

  ppg: number | null;
  rpg: number | null;
  apg: number | null;

  ts_pct: number | null;
  efg_pct: number | null;
  usg_pct: number | null;
}


export interface TeamPercentiles {
  team_count: number | null;

  ppg: number | null;
  ppg_rank: number | null;

  two_pct: number | null;
  two_pct_rank: number | null;

  three_pct: number | null;
  three_pct_rank: number | null;

  ft_pct: number | null;
  ft_pct_rank: number | null;

  rebounds: number | null;
  rebounds_rank: number | null;

  assists: number | null;
  assists_rank: number | null;

  steals: number | null;
  steals_rank: number | null;

  turnovers: number | null;
  turnovers_rank: number | null;

  blocks: number | null;
  blocks_rank: number | null;

  efficiency: number | null;
  efficiency_rank: number | null;
}


export interface LeagueTeamAverages {
  ppg: number | null;

  two_pct: number | null;
  three_pct: number | null;
  ft_pct: number | null;

  rebounds: number | null;
  assists: number | null;
  steals: number | null;
  turnovers: number | null;
  blocks: number | null;

  efficiency: number | null;
}


export interface TeamAnalysisResponse {
  team_id: number;

  team_name: string;
  city: string | null;
  team_code: string | null;
  logo_url: string | null;

  colors: {
    primary: string | null;
    secondary: string | null;
  };

  season_id: number;
  season: string;

  record: TeamRecord;
  stats: TeamStats;

  percentiles: TeamPercentiles;
  league_averages: LeagueTeamAverages;

  roster: TeamRosterPlayer[];
}


/* =========================================================
   TEAM SHOT ANALYSIS
   ========================================================= */

export interface TeamShotAnalysisResponse {
  team: {
    team_id: number;
    team_name: string;
  };

  offense: {
    summary: TeamOffenseShotSummary;
    zones: TeamOffenseShotZone[];
  };

  defense: {
    summary: TeamDefenseShotSummary;
    zones: TeamDefenseShotZone[];
  };
}


export interface TeamOffenseShotSummary {
  total_fga: number;

  primary_strengths: string[];
  strengths: string[];
  opportunities: string[];
  overused: string[];
  weaknesses: string[];
}


export interface TeamDefenseShotSummary {
  total_opp_fga: number;

  primary_strengths: string[];
  strengths: string[];
  concerns: string[];
  weaknesses: string[];
}


export interface TeamOffenseShotZone {
  shot_zone: string;

  shooting: {
    fga: number;
    fgm: number;

    fg_pct: number | null;
    league_fg_pct: number | null;
    fg_pct_diff: number | null;

    performance_percentile: number | null;
    performance_level: string;
  };

  usage: {
    shot_frequency_pct: number | null;
    league_shot_frequency_pct: number | null;
    frequency_diff: number | null;

    frequency_percentile: number | null;
    volume_level: string;
  };

  scoring: {
    points: number;

    points_per_shot: number | null;
    league_points_per_shot: number | null;
    points_per_shot_diff: number | null;
  };

  profile: {
    zone_profile: string;
  };
}


export interface TeamDefenseShotZone {
  shot_zone: string;

  shot_defense: {
    opp_fga: number;
    opp_fgm: number;

    opp_fg_pct: number | null;
    league_fg_pct: number | null;
    opp_fg_pct_diff: number | null;

    percentile: number | null;
    level: string;
  };

  suppression: {
    opp_shot_frequency_pct: number | null;
    league_shot_frequency_pct: number | null;
    frequency_diff: number | null;

    percentile: number | null;
    level: string;
  };

  scoring: {
    opp_points: number;

    opp_points_per_shot: number | null;
    league_points_per_shot: number | null;
    points_per_shot_diff: number | null;
  };

  profile: {
    zone_profile: string;
  };
}


/* =========================================================
   MATCHUP OPPONENT
   ========================================================= */

export interface MatchupOpponent {
  team_id: number;
  team_name: string;
}


/* =========================================================
   TEAM MATCHUP ANALYSIS
   ========================================================= */

export interface TeamMatchupAnalysisResponse {
  team: {
    team_id: number;
    team_name: string;
  };

  opponent: {
    team_id: number;
    team_name: string;
  };

  summary: TeamMatchupSummary;

  zones: TeamMatchupZone[];
}


export interface TeamMatchupSummary {
  primary_attacks: string[];
  attacks: string[];

  efficiency_opportunities: string[];
  volume_opportunities: string[];
  access_opportunities: string[];

  temptations: string[];
  low_access: string[];
  difficult: string[];
  avoid: string[];
}


export interface TeamMatchupZone {
  shot_zone: string;

  offense: {
    fga: number;
    fgm: number;

    fg_pct: number | null;
    league_fg_pct: number | null;
    fg_pct_diff: number | null;

    performance_percentile: number | null;
    performance_level: string;

    shot_frequency_pct: number | null;
    league_shot_frequency_pct: number | null;
    frequency_diff: number | null;

    frequency_percentile: number | null;
    volume_level: string;

    points_per_shot: number | null;
    league_points_per_shot: number | null;
    points_per_shot_diff: number | null;

    zone_profile: string;
  };

  defense: {
    opp_fga: number;
    opp_fgm: number;

    opp_fg_pct: number | null;
    opp_fg_pct_diff: number | null;

    shot_defense_percentile: number | null;
    shot_defense_level: string;

    opp_shot_frequency_pct: number | null;
    frequency_diff: number | null;

    suppression_percentile: number | null;
    suppression_level: string;

    opp_points_per_shot: number | null;
    points_per_shot_diff: number | null;

    zone_profile: string;
  };

  matchup: {
    efficiency_edge: number | null;
    access_edge: number | null;

    profile: string;
  };
}


/* =========================================================
   SERVICE
   ========================================================= */

@Injectable({
  providedIn: 'root'
})
export class Team {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'https://basketball-analysis-hb52.onrender.com/api';


  /* =======================================================
     GENERAL TEAM ANALYSIS
     ======================================================= */

  getAnalysis(
    teamId: number,
    seasonId: number
  ): Observable<TeamAnalysisResponse> {

    return this.http.get<TeamAnalysisResponse>(
      `${this.apiUrl}/teams/${teamId}/analysis`,
      {
        params: {
          season_id: seasonId.toString()
        }
      }
    );
  }


  /* =======================================================
     TEAM SHOT ANALYSIS
     ======================================================= */

  getShotAnalysis(
    teamId: number
  ): Observable<TeamShotAnalysisResponse> {

    return this.http.get<TeamShotAnalysisResponse>(
      `${this.apiUrl}/teams/${teamId}/shot-analysis`
    );
  }


  /* =======================================================
     MATCHUP OPPONENT LIST
     ======================================================= */

  getMatchupOpponents():
    Observable<MatchupOpponent[]> {

    return this.http.get<MatchupOpponent[]>(
      `${this.apiUrl}/teams/matchup/opponents`
    );
  }


  /* =======================================================
     TEAM MATCHUP ANALYSIS
     ======================================================= */

  getMatchupAnalysis(
    teamId: number,
    opponentTeamId: number
  ): Observable<TeamMatchupAnalysisResponse> {

    return this.http.get<TeamMatchupAnalysisResponse>(
      `${this.apiUrl}/teams/${teamId}/matchup/${opponentTeamId}`
    );
  }

}