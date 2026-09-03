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


/* =====================================================
   PLAYER LIST OPTION
   Compare dropdown'ları için
===================================================== */

export interface ComparisonPlayerOption {
  player_id: number;
  player_name: string;

  team_id: number;
  team_name: string;

  image_url?: string | null;

  games?: number | null;
  average_minutes?: number | null;
  points_per_game?: number | null;
}


/* =====================================================
   COMPARISON STATS
===================================================== */

export interface ComparisonStats {
  ppg: number | null;
  rpg: number | null;
  apg: number | null;

  efg_pct: number | null;
  ts_pct: number | null;

  usg_pct: number | null;
  tov_pct: number | null;

  ast_pct: number | null;
  ast_to: number | null;

  three_par: number | null;
  ft_rate: number | null;
}


/* =====================================================
   COMPARISON PERCENTILES
===================================================== */

export interface ComparisonPercentiles {
  ts: number | null;
  efg: number | null;

  usg: number | null;
  tov: number | null;

  ast: number | null;
  ast_to: number | null;

  three_par: number | null;
  ft_rate: number | null;
}


/* =====================================================
   SINGLE PLAYER IN COMPARISON
===================================================== */

export interface ComparisonPlayer {
  player_id: number;
  player_name: string;

  team_id: number;
  team_name: string;

  stats: ComparisonStats;

  percentiles: ComparisonPercentiles;
}


/* =====================================================
   COMPARISON API RESPONSE
===================================================== */

export interface PlayerComparisonResponse {
  season_id: number;
  season: string;

  player1: ComparisonPlayer;
  player2: ComparisonPlayer;
}


/* =====================================================
   SERVICE
===================================================== */

@Injectable({
  providedIn: 'root'
})
export class PlayerComparisonApi {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'https://basketball-analysis-hb52.onrender.com/api';


  /* ===================================================
     GET ALL PLAYERS FOR SEASON

     Compare dropdown'larını doldurur.
  =================================================== */

  getPlayers(
    seasonId: number
  ): Observable<ComparisonPlayerOption[]> {

    return this.http.get<ComparisonPlayerOption[]>(
      `${this.apiUrl}/players`,
      {
        params: {
          season_id:
            seasonId.toString()
        }
      }
    );
  }


  /* ===================================================
     COMPARE TWO PLAYERS
  =================================================== */

  compare(
    player1: number,
    player2: number,
    seasonId: number
  ): Observable<PlayerComparisonResponse> {

    return this.http.get<PlayerComparisonResponse>(
      `${this.apiUrl}/players/compare`,
      {
        params: {
          player1:
            player1.toString(),

          player2:
            player2.toString(),

          season_id:
            seasonId.toString()
        }
      }
    );
  }
}