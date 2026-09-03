import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  Navigation,
  SeasonOption,
  TeamOption,
  PlayerOption
} from '../../core/navigation';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  /* =========================================================
     SERVICES
     ========================================================= */

  private readonly navigation =
    inject(Navigation);

  private readonly router =
    inject(Router);


  /* =========================================================
     DATA
     ========================================================= */

  seasons =
    signal<SeasonOption[]>([]);

  teams =
    signal<TeamOption[]>([]);

  players =
    signal<PlayerOption[]>([]);


  /* =========================================================
     SELECTED VALUES
     ========================================================= */

  selectedSeasonId =
    signal<number>(172);

  selectedTeamId =
    signal<number | null>(null);

  selectedPlayerId =
    signal<number | null>(null);


  /* =========================================================
     LOADING STATES
     ========================================================= */

  loadingTeams =
    signal<boolean>(false);

  loadingPlayers =
    signal<boolean>(false);


  /* =========================================================
     CONSTRUCTOR
     ========================================================= */

  constructor() {

    this.loadSeasons();

  }


  /* =========================================================
     SEASONS
     ========================================================= */

  private loadSeasons(): void {

    this.navigation
      .getSeasons()
      .subscribe({

        next: seasons => {

          this.seasons.set(
            seasons
          );


          /*
           * Varsayılan sezon:
           * 2025-2026
           */

          const defaultSeason =
            seasons.find(
              season =>
                season.season_id === 172
            );


          if (defaultSeason) {

            this.selectedSeasonId.set(
              defaultSeason.season_id
            );

            this.loadTeams(
              defaultSeason.season_id
            );

            return;
          }


          /*
           * 172 bulunamazsa ilk sezonu kullan.
           */

          if (seasons.length > 0) {

            const firstSeason =
              seasons[0];

            this.selectedSeasonId.set(
              firstSeason.season_id
            );

            this.loadTeams(
              firstSeason.season_id
            );

          }

        },


        error: err => {

          console.error(
            'Season loading error',
            err
          );

        }

      });

  }


  /* =========================================================
     SEASON CHANGE
     ========================================================= */

  onSeasonChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const seasonId =
      Number(select.value);


    if (!seasonId) {
      return;
    }


    this.selectedSeasonId.set(
      seasonId
    );


    /*
     * Sezon değiştiğinde eski team/player
     * seçimlerini temizliyoruz.
     */

    this.selectedTeamId.set(
      null
    );

    this.selectedPlayerId.set(
      null
    );

    this.teams.set([]);

    this.players.set([]);


    /*
     * Yeni sezonun takımlarını yükle.
     */

    this.loadTeams(
      seasonId
    );

  }


  /* =========================================================
     TEAMS
     ========================================================= */

  private loadTeams(
    seasonId: number
  ): void {

    this.loadingTeams.set(
      true
    );


    this.navigation
      .getTeams(
        seasonId
      )
      .subscribe({

        next: teams => {

          this.teams.set(
            teams
          );

          this.loadingTeams.set(
            false
          );

        },


        error: err => {

          console.error(
            'Team loading error',
            err
          );

          this.teams.set([]);

          this.loadingTeams.set(
            false
          );

        }

      });

  }


  /* =========================================================
     TEAM DROPDOWN CHANGE
     ========================================================= */

  onTeamChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const teamId =
      Number(select.value);


    /*
     * "Select team" seçilmişse temizle.
     */

    if (!teamId) {

      this.selectedTeamId.set(
        null
      );

      this.selectedPlayerId.set(
        null
      );

      this.players.set([]);

      return;

    }


    /*
     * Dropdown seçimini kaydet.
     *
     * Burada team sayfasına gitmiyoruz.
     * Bunun için SELECT butonu kullanılacak.
     */

    this.selectedTeamId.set(
      teamId
    );


    /*
     * Takım değişince eski player seçimini
     * sıfırla.
     */

    this.selectedPlayerId.set(
      null
    );

    this.players.set([]);


    /*
     * Player dropdown'unu doldur.
     */

    this.loadPlayers(
      teamId,
      this.selectedSeasonId()
    );

  }


  /* =========================================================
     OPEN SELECTED TEAM
     ========================================================= */

  openSelectedTeam(): void {

    const teamId =
      this.selectedTeamId();


    if (!teamId) {
      return;
    }


    this.router.navigate(
      [
        '/team',
        teamId
      ],
      {
        queryParams: {
          season:
            this.selectedSeasonId()
        }
      }
    );

  }


  /* =========================================================
     PLAYERS
     ========================================================= */

  private loadPlayers(
    teamId: number,
    seasonId: number
  ): void {

    this.loadingPlayers.set(
      true
    );


    this.navigation
      .getPlayers(
        teamId,
        seasonId
      )
      .subscribe({

        next: players => {

          this.players.set(
            players
          );

          this.loadingPlayers.set(
            false
          );

        },


        error: err => {

          console.error(
            'Player loading error',
            err
          );

          this.players.set([]);

          this.loadingPlayers.set(
            false
          );

        }

      });

  }


  /* =========================================================
     PLAYER CHANGE
     ========================================================= */

  onPlayerChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;

    const playerId =
      Number(select.value);


    if (!playerId) {

      this.selectedPlayerId.set(
        null
      );

      return;

    }


    this.selectedPlayerId.set(
      playerId
    );


    /*
     * Player seçildiğinde direkt
     * Player Analysis sayfasına git.
     */

    this.router.navigate(
      [
        '/player',
        playerId
      ],
      {
        queryParams: {
          season:
            this.selectedSeasonId()
        }
      }
    );

  }

}