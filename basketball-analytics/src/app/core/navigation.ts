import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SeasonOption {
  season_id: number;
  season: string;
}

export interface TeamOption {
  team_id: number;
  team_name: string;
  city: string | null;
  team_code: string | null;
  logo_url: string | null;
  color_1: string | null;
  color_2: string | null;
}

export interface PlayerOption {
  player_id: number;
  player_name: string;
  image_url: string | null;
  games: number;
  average_minutes: number | null;
  points_per_game: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class Navigation {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'http://localhost:8000/api';

  getSeasons(): Observable<SeasonOption[]> {
    return this.http.get<SeasonOption[]>(
      `${this.apiUrl}/seasons`
    );
  }

  getTeams(
    seasonId: number
  ): Observable<TeamOption[]> {
    return this.http.get<TeamOption[]>(
      `${this.apiUrl}/teams`,
      {
        params: {
          season_id: seasonId
        }
      }
    );
  }

  getPlayers(
    teamId: number,
    seasonId: number
  ): Observable<PlayerOption[]> {
    return this.http.get<PlayerOption[]>(
      `${this.apiUrl}/teams/${teamId}/players`,
      {
        params: {
          season_id: seasonId
        }
      }
    );
  }
}