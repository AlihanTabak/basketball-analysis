import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;

  efg_pct: number | null;
  ts_pct: number | null;

  usg_pct: number | null;
  tov_pct: number | null;

  ast_pct: number | null;
  ast_to: number | null;

  three_par: number | null;
  ft_rate: number | null;
}

export interface PlayerPercentiles {
  eligible: boolean;

  player_count: number | null;

  ts: number | null;
  ts_rank: number | null;

  efg: number | null;
  efg_rank: number | null;

  usg: number | null;
  usg_rank: number | null;

  ast: number | null;
  ast_rank: number | null;

  ast_to: number | null;
  ast_to_rank: number | null;

  tov: number | null;
  tov_rank: number | null;

  three_par: number | null;
  three_par_rank: number | null;

  ft_rate: number | null;
  ft_rate_rank: number | null;
}

export interface LeagueAverages {
  ts: number | null;
  efg: number | null;
  usg: number | null;
  tov: number | null;
  ast: number | null;
  ast_to: number | null;
  three_par: number | null;
  ft_rate: number | null;
}

export interface PlayerAnalysisResponse {
  player_id: number;
  percentiles: PlayerPercentiles;
  league_averages: LeagueAverages;
  player_name: string;
  player_image_url: string | null;

  team_id: number;
  team_name: string;
  team_city: string | null;
  team_code: string | null;
  team_logo_url: string | null;

  team_colors: {
    primary: string | null;
    secondary: string | null;
  };

  season_id: number;
  season: string;

  games: number;
  average_minutes: number;

  stats: PlayerStats;

  archetypes: string[];
}

export interface ShotAnalysisResponse {
  player: {
    player_id: number;
    player_name: string;
  };

  season_id: number;
  season: string;

  summary: {
    total_fga: number;
    primary_strengths: string[];
    strengths: string[];
    tentative_strengths: string[];
    weaknesses: string[];
    limited_sample: string[];
  };

  zones: ShotZoneAnalysis[];
}


export interface ShotZoneAnalysis {
  shot_zone: string;
  shot_type: string;

  shooting: {
    fga: number;
    fgm: number;
    fg_pct: number | null;
    league_fg_pct: number | null;
    fg_pct_diff: number | null;
    performance_percentile: number | null;
    performance_level: string;
  };

  scoring: {
    points: number;
    points_per_shot: number | null;
    league_points_per_shot: number | null;
    points_per_shot_diff: number | null;
  };

  usage: {
    shot_frequency_pct: number;
    league_shot_frequency_pct: number;
    frequency_diff: number;
    frequency_percentile: number | null;
    volume_level: string;
  };

  bayesian: {
    prior_fg_pct: number | null;
    prior_strength: number | null;
    alpha: number | null;
    beta: number | null;
    eb_skill_fg_pct: number | null;
    eb_skill_diff: number | null;
    evidence_weight_pct: number | null;
  };

  reliability: {
    sample_level: string;
    performance_percentile_eligible: boolean;
    frequency_percentile_eligible: boolean;
  };

  profile: {
    zone_profile: string;
  };
}


@Injectable({
  providedIn: 'root'
})
export class Player {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://basketball-analysis-hb52.onrender.com/api';


  getAnalysis(
    playerId: number,
    seasonId = 172
  ): Observable<PlayerAnalysisResponse> {

    return this.http.get<PlayerAnalysisResponse>(
      `${this.apiUrl}/players/${playerId}/analysis`,
      {
        params: {
          season_id: seasonId
        }
      }
    );
  }

  getPlayerShotAnalysis(
  playerId: number,
  seasonId: number = 172
) {
  return this.http.get<ShotAnalysisResponse>(
    `${this.apiUrl}/players/${playerId}/shot-analysis`,
    {
      params: {
        season_id: seasonId
      }
    }
  );
}
}