import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  combineLatest
} from 'rxjs';

import {
  Player,
  PlayerAnalysisResponse,
  ShotAnalysisResponse
} from '../../services/player';

import {
  PlayerShotAnalysis
} from '../../components/player-shot-analysis/player-shot-analysis';


@Component({
  selector: 'app-player-analysis',

  standalone: true,

  imports: [
    PlayerShotAnalysis
  ],

  templateUrl: './player-analysis.html',
  styleUrl: './player-analysis.scss'
})
export class PlayerAnalysis {

  private readonly playerService =
    inject(Player);

  private readonly route =
    inject(ActivatedRoute);

  player =
    signal<PlayerAnalysisResponse | null>(null);

  shotAnalysis =
    signal<ShotAnalysisResponse | null>(null);

  loading =
    signal(true);

  error =
    signal<string | null>(null);


  constructor() {

    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ])
      .subscribe(
        ([params, queryParams]) => {

          const playerId =
            Number(
              params.get('id')
            );

          const seasonId =
            Number(
              queryParams.get('season')
              ?? 172
            );


          if (!playerId || !seasonId) {

            this.error.set(
              'Geçersiz oyuncu veya sezon.'
            );

            this.loading.set(false);

            return;
          }


          this.loadPlayer(
            playerId,
            seasonId
          );
        }
      );
  }


  private loadPlayer(
  playerId: number,
  seasonId: number
): void {

  this.loading.set(true);
  this.error.set(null);

  this.player.set(null);
  this.shotAnalysis.set(null);


  combineLatest([
    this.playerService.getAnalysis(
      playerId,
      seasonId
    ),

    this.playerService.getPlayerShotAnalysis(
      playerId,
      seasonId
    )
  ])
    .subscribe({

      next: ([
        playerData,
        shotData
      ]) => {

        console.log(
          'PLAYER DATA:',
          playerData
        );

        console.log(
          'SHOT ANALYSIS:',
          shotData
        );


        this.player.set(
          playerData
        );

        this.shotAnalysis.set(
          shotData
        );


        this.loading.set(false);
      },


      error: err => {

        console.error(
          'Player loading error:',
          err
        );


        if (err.status === 404) {

          this.error.set(
            'Bu oyuncu için seçilen sezonda veri bulunamadı.'
          );

        } else {

          this.error.set(
            'Oyuncu verisi alınamadı.'
          );
        }


        this.loading.set(false);
      }

    });
}

  /*
   * Normal yüzde değerleri.
   *
   * Örnek:
   * TS = 58.437 -> 58.4%
   *
   * multiply=true:
   * three_par = 0.459 -> 45.9%
   */
  formatPercent(
    value: number | null | undefined,
    multiply = false
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    const finalValue =
      multiply
        ? value * 100
        : value;

    return `${finalValue.toFixed(1)}%`;
  }


  /*
   * Normal sayısal değer.
   *
   * Örnek:
   * AST/TOV = 1.6088 -> 1.61
   */
  formatNumber(
    value: number | null | undefined,
    decimals = 2
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return value.toFixed(decimals);
  }


  /*
   * PPG / RPG / APG / MPG gibi
   * değerler için.
   */
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


  /*
   * Percentile bar genişliği.
   *
   * 75 -> 75%
   */
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
        Math.min(100, value)
      );

    return `${safeValue}%`;
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

  formatDifference(
  value: number | null | undefined,
  average: number | null | undefined,
  multiply = false
): string {

  if (
    value === null ||
    value === undefined ||
    average === null ||
    average === undefined
  ) {
    return '-';
  }

  let difference = value - average;

  if (multiply) {
    difference *= 100;
  }

  const sign =
    difference > 0
      ? '+'
      : '';

  return `${sign}${difference.toFixed(1)}`;
}


  /*
   * Percentile etiketi.
   *
   * 75.4 -> P75
   */
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


  /*
   * Percentile değerini
   * "Top %" formatına çevirir.
   *
   * P75 -> Top %25
   * P90 -> Top %10
   */
  formatTopPercent(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    const topPercent =
      Math.max(
        1,
        Math.round(100 - value)
      );

    return `Top %${topPercent}`;
  }

  differenceClass(
  value: number | null | undefined,
  leagueValue: number | null | undefined,
  mode: 'higher-better' | 'lower-better' | 'neutral' = 'higher-better'
): string {

  if (
    value === null ||
    value === undefined ||
    leagueValue === null ||
    leagueValue === undefined
  ) {
    return 'neutral';
  }

  if (mode === 'neutral') {
    return 'neutral';
  }

  const diff = value - leagueValue;

  if (Math.abs(diff) < 0.01) {
    return 'neutral';
  }

  if (mode === 'lower-better') {
    return diff < 0
      ? 'positive'
      : 'negative';
  }

  return diff > 0
    ? 'positive'
    : 'negative';
}


  /*
   * TBF logosu 403 dönerse
   * kırık görseli gizle.
   */
  onLogoError(
    event: Event
  ): void {

    const img =
      event.target as HTMLImageElement;

    img.style.display = 'none';
  }
}