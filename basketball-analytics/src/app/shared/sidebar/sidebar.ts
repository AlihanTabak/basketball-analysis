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
     CURRENT SEASON
     ========================================================= */

  readonly currentSeasonId = 172;


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

  teams =
    signal<TeamOption[]>([]);

  players =
    signal<PlayerOption[]>([]);


  /* =========================================================
     SELECTED VALUES
     ========================================================= */

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

    this.loadTeams();

  }


  /* =========================================================
     TEAMS
     ========================================================= */

  private loadTeams(): void {

    this.loadingTeams.set(
      true
    );


    this.navigation
      .getTeams(
        this.currentSeasonId
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


    this.selectedTeamId.set(
      teamId
    );


    this.selectedPlayerId.set(
      null
    );

    this.players.set([]);


    this.loadPlayers(
      teamId
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
            this.currentSeasonId
        }
      }
    );

  }


  /* =========================================================
     PLAYERS
     ========================================================= */

  private loadPlayers(
    teamId: number
  ): void {

    this.loadingPlayers.set(
      true
    );


    this.navigation
      .getPlayers(
        teamId,
        this.currentSeasonId
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


    this.router.navigate(
      [
        '/player',
        playerId
      ],
      {
        queryParams: {
          season:
            this.currentSeasonId
        }
      }
    );

  }

}