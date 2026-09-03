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
  PlayerComparisonApi,
  PlayerComparisonResponse,
  ComparisonPlayerOption
} from '../../services/player-comparison-api';


@Component({
  selector: 'app-player-comparison',
  imports: [],
  templateUrl: './player-comparison.html',
  styleUrl: './player-comparison.scss'
})
export class PlayerComparison {

  private readonly comparisonApi =
    inject(PlayerComparisonApi);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);


  players =
    signal<ComparisonPlayerOption[]>([]);

  selectedPlayer1 =
    signal<number | null>(null);

  selectedPlayer2 =
    signal<number | null>(null);

  selectedSeason =
    signal<number>(172);

  data =
    signal<PlayerComparisonResponse | null>(null);

  loading =
    signal<boolean>(false);

  error =
    signal<string | null>(null);


  constructor() {

    this.route.queryParamMap
      .subscribe(params => {

        const seasonId =
          Number(
            params.get('season') ?? 172
          );

        const player1 =
          Number(
            params.get('player1')
          );

        const player2 =
          Number(
            params.get('player2')
          );


        this.selectedSeason.set(
          seasonId
        );

        this.loadPlayers(
          seasonId
        );


        this.selectedPlayer1.set(
          player1 || null
        );

        this.selectedPlayer2.set(
          player2 || null
        );


        /*
         * /compare sayfasına ilk girişte
         * player1/player2 olmayabilir.
         *
         * Bu bir hata değil;
         * kullanıcı dropdown'dan seçecek.
         */
        if (
          !player1 ||
          !player2
        ) {

          this.data.set(null);

          this.loading.set(false);

          this.error.set(null);

          return;
        }


        if (
          player1 === player2
        ) {

          this.data.set(null);

          this.loading.set(false);

          this.error.set(
            'Karşılaştırma için iki farklı oyuncu seçmelisin.'
          );

          return;
        }


        this.loadComparison(
          player1,
          player2,
          seasonId
        );
      });
  }


  /*
   * =====================================================
   * PLAYER LIST
   * =====================================================
   */

  private loadPlayers(
    seasonId: number
  ): void {

    this.comparisonApi
      .getPlayers(
        seasonId
      )
      .subscribe({

        next: (
          players: ComparisonPlayerOption[]
        ): void => {

          this.players.set(
            players
          );
        },


        error: (
          error: unknown
        ): void => {

          console.error(
            'Comparison player list error:',
            error
          );
        }

      });
  }


  /*
   * =====================================================
   * COMPARISON
   * =====================================================
   */

  private loadComparison(
    player1: number,
    player2: number,
    seasonId: number
  ): void {

    this.loading.set(true);

    this.error.set(null);

    this.data.set(null);


    this.comparisonApi
      .compare(
        player1,
        player2,
        seasonId
      )
      .subscribe({

        next: (
          response: PlayerComparisonResponse
        ): void => {

          this.data.set(
            response
          );

          this.loading.set(false);
        },


        error: (
          error: unknown
        ): void => {

          console.error(
            'Player comparison loading error:',
            error
          );

          this.error.set(
            'Oyuncu karşılaştırması alınamadı.'
          );

          this.loading.set(false);
        }

      });
  }


  /*
   * =====================================================
   * SELECT EVENTS
   * =====================================================
   */

  onPlayer1Change(
    event: Event
  ): void {

    const value =
      Number(
        (
          event.target as HTMLSelectElement
        ).value
      );

    this.selectedPlayer1.set(
      value || null
    );

    this.error.set(null);
  }


  onPlayer2Change(
    event: Event
  ): void {

    const value =
      Number(
        (
          event.target as HTMLSelectElement
        ).value
      );

    this.selectedPlayer2.set(
      value || null
    );

    this.error.set(null);
  }


  /*
   * =====================================================
   * NAVIGATION
   * =====================================================
   */

  compareSelected(): void {

    const player1 =
      this.selectedPlayer1();

    const player2 =
      this.selectedPlayer2();


    if (
      !player1 ||
      !player2
    ) {

      this.error.set(
        'İki oyuncu seçmelisin.'
      );

      return;
    }


    if (
      player1 === player2
    ) {

      this.error.set(
        'Karşılaştırma için iki farklı oyuncu seçmelisin.'
      );

      return;
    }


    this.router.navigate(
      ['/compare'],
      {
        queryParams: {
          season:
            this.selectedSeason(),

          player1,

          player2
        }
      }
    );
  }


  /*
   * =====================================================
   * FORMAT HELPERS
   * =====================================================
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

    return value.toFixed(
      decimals
    );
  }


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

seasonName(
  seasonId: number
): string {

  const seasons: Record<number, string> = {
    174: '2026-2027',
    172: '2025-2026',
    170: '2024-2025',
    168: '2023-2024',
    166: '2022-2023'
  };

  return seasons[seasonId]
    ?? seasonId.toString();
}
}

