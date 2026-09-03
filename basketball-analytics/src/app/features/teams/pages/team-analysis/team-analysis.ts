import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  combineLatest,
  forkJoin
} from 'rxjs';

import {
  Team,
  TeamAnalysisResponse,
  TeamShotAnalysisResponse
} from '../../services/team';

import {
  TeamShotAnalysis
} from '../team-shot-analysis/team-shot-analysis';


@Component({
  selector: 'app-team-analysis',
  standalone: true,
  imports: [TeamShotAnalysis],
  templateUrl: './team-analysis.html',
  styleUrl: './team-analysis.scss'
})

export class TeamAnalysis {

  private readonly teamService =
    inject(Team);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);


  team =
    signal<TeamAnalysisResponse | null>(null);

  shotAnalysis =
    signal<TeamShotAnalysisResponse | null>(null);

  loading =
    signal<boolean>(true);

  error =
    signal<string | null>(null);


  constructor() {

    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .subscribe(
        ([params, queryParams]) => {

          const teamId =
            Number(
              params.get('teamId')
            );

          const seasonId =
            Number(
              queryParams.get('season')
              ?? 172
            );


          if (
            !teamId ||
            !seasonId
          ) {

            this.error.set(
              'Geçersiz takım veya sezon.'
            );

            this.loading.set(false);

            return;
          }


          this.loadTeam(
            teamId,
            seasonId
          );
        }
      );
  }


  private loadTeam(
    teamId: number,
    seasonId: number
  ): void {

    this.loading.set(true);

    this.error.set(null);

    this.team.set(null);
    this.shotAnalysis.set(null);


    forkJoin({

      analysis:
        this.teamService.getAnalysis(
          teamId,
          seasonId
        ),

      shotAnalysis:
        this.teamService.getShotAnalysis(
          teamId
        )

    })
      .subscribe({

        next: ({
          analysis,
          shotAnalysis
        }): void => {

          this.team.set(analysis);

          this.shotAnalysis.set(
            shotAnalysis
          );

          this.loading.set(false);
        },


        error: (
          error: unknown
        ): void => {

          console.error(
            'Team loading error:',
            error
          );

          this.error.set(
            'Takım verisi alınamadı.'
          );

          this.loading.set(false);
        }

      });
  }


  openPlayer(
    playerId: number,
    seasonId: number
  ): void {

    this.router.navigate(
      ['/player', playerId],
      {
        queryParams: {
          season: seasonId
        }
      }
    );
  }


  formatValue(
    value: number | null | undefined,
    decimals = 1
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return value.toFixed(decimals);
  }


  formatPercent(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return `${value.toFixed(1)}%`;
  }


  winPct(
    wins: number,
    games: number
  ): string {

    if (!games) {
      return '-';
    }

    return `${(
      wins / games * 100
    ).toFixed(1)}%`;
  }


  percentileWidth(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '0%';
    }

    const safeValue =
      Math.max(
        0,
        Math.min(
          100,
          value
        )
      );

    return `${safeValue}%`;
  }


  formatPercentile(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return `P${Math.round(value)}`;
  }


  formatRank(
    rank: number | null | undefined,
    total: number | null | undefined
  ): string {

    if (
      rank === null ||
      rank === undefined ||
      total === null ||
      total === undefined
    ) {
      return '-';
    }

    return `#${rank} / ${total}`;
  }


  difference(
    value: number | null | undefined,
    average: number | null | undefined,
    decimals = 1
  ): string {

    if (
      value === null ||
      value === undefined ||
      average === null ||
      average === undefined
    ) {
      return '-';
    }

    const diff =
      value - average;

    const sign =
      diff > 0
        ? '+'
        : '';

    return `${sign}${diff.toFixed(decimals)}`;
  }


  differenceClass(
    value: number | null | undefined,
    average: number | null | undefined,
    lowerIsBetter = false
  ): string {

    if (
      value === null ||
      value === undefined ||
      average === null ||
      average === undefined
    ) {
      return '';
    }

    if (value === average) {
      return 'neutral';
    }

    const better =
      lowerIsBetter
        ? value < average
        : value > average;

    return better
      ? 'positive'
      : 'negative';
  }


  onLogoError(
    event: Event
  ): void {

    const img =
      event.target as HTMLImageElement;

    img.style.display =
      'none';
  }
}