import {
  Component,
  computed,
  input,
  signal
} from '@angular/core';

import {
  ShotAnalysisResponse,
  ShotZoneAnalysis
} from '../../services/player';


interface CourtZonePosition {
  zone: string;
  x: number;
  y: number;
}


interface CourtZoneView {
  position: CourtZonePosition;
  data: ShotZoneAnalysis;
}

interface CoachInsight {
  type:
    | 'positive'
    | 'warning'
    | 'neutral'
    | 'limited';

  title: string;
  text: string;
}


@Component({
  selector: 'app-player-shot-analysis',
  standalone: true,
  imports: [],
  templateUrl: './player-shot-analysis.html',
  styleUrl: './player-shot-analysis.scss'
})
export class PlayerShotAnalysis {

  data =
    input.required<ShotAnalysisResponse>();

  selectedZoneName =
  signal<string | null>(null);

  coachInsights =
  computed<CoachInsight[]>(() => {

    const zones =
      this.data().zones;

    const insights:
      CoachInsight[] = [];


    for (const zone of zones) {

      const zoneName =
        this.formatZoneName(
          zone.shot_zone
        );

      const profile =
        zone.profile.zone_profile;

      const fgDiff =
        zone.shooting.fg_pct_diff;

      const frequencyDiff =
        zone.usage.frequency_diff;


      /* ================================================
         PRIMARY / CLEAR STRENGTH
      ================================================= */

      if (
        profile === 'PRIMARY_STRENGTH' ||
        profile === 'STRENGTH'
      ) {

        insights.push({
          type: 'positive',

          title: `${zoneName} güçlü bölge`,

          text:
            `${zoneName} bölgesinde oyuncu yüksek hacimle birlikte güçlü verimlilik gösteriyor.`
        });

        continue;
      }


      /* ================================================
         POSITIVE
      ================================================= */

      if (
        profile === 'POSITIVE'
      ) {

        insights.push({
          type: 'positive',

          title: `${zoneName} pozitif`,

          text:
            fgDiff !== null
              ? `${zoneName} bölgesindeki FG% lig ortalamasının ${Math.abs(fgDiff).toFixed(1)} puan üzerinde.`
              : `${zoneName} bölgesinde pozitif bir performans profili var.`
        });

        continue;
      }


      /* ================================================
         UNDERUSED STRENGTH
      ================================================= */

      if (
        profile === 'UNDERUSED_STRENGTH'
      ) {

        insights.push({
          type: 'positive',

          title: `${zoneName} daha fazla kullanılabilir`,

          text:
            `${zoneName} verimli bir bölge olmasına rağmen oyuncunun şut dağılımında düşük hacimde kullanılıyor.`
        });

        continue;
      }


      /* ================================================
         OPPORTUNITY
      ================================================= */

      if (
        profile === 'OPPORTUNITY'
      ) {

        insights.push({
          type: 'positive',

          title: `${zoneName} fırsat bölgesi`,

          text:
            `${zoneName} bölgesindeki performans olumlu; mevcut kullanım seviyesi artırılabilecek bir alan olabilir.`
        });

        continue;
      }


      /* ================================================
         OVERUSED
      ================================================= */

      if (
        profile === 'OVERUSED'
      ) {

        insights.push({
          type: 'warning',

          title: `${zoneName} fazla kullanılıyor`,

          text:
            fgDiff !== null
              ? `${zoneName} yüksek hacimde kullanılıyor ancak FG% lig ortalamasının ${Math.abs(fgDiff).toFixed(1)} puan altında.`
              : `${zoneName} yüksek hacimde kullanılmasına rağmen verimlilik düşük.`
        });

        continue;
      }


      /* ================================================
         WEAKNESS
      ================================================= */

      if (
        profile === 'WEAKNESS'
      ) {

        insights.push({
          type: 'warning',

          title: `${zoneName} zayıf bölge`,

          text:
            fgDiff !== null
              ? `${zoneName} bölgesindeki FG% lig ortalamasının ${Math.abs(fgDiff).toFixed(1)} puan altında.`
              : `${zoneName} bölgesinde verimlilik düşük.`
        });

        continue;
      }


      /* ================================================
         AVOID
      ================================================= */

      if (
        profile === 'AVOID'
      ) {

        insights.push({
          type: 'warning',

          title: `${zoneName} düşük değerli bölge`,

          text:
            `${zoneName} düşük kullanım ve düşük verimlilik kombinasyonu gösteriyor.`
        });

        continue;
      }


      /* ================================================
         TENTATIVE POSITIVE
      ================================================= */

      if (
        profile === 'TENTATIVE_STRENGTH' ||
        profile === 'TENTATIVE_POSITIVE'
      ) {

        insights.push({
          type: 'neutral',

          title: `${zoneName} olumlu sinyal`,

          text:
            `${zoneName} bölgesinde olumlu bir performans sinyali var ancak örneklem henüz güçlü bir sonuç için sınırlı.`
        });

        continue;
      }


      /* ================================================
         TENTATIVE WEAKNESS
      ================================================= */

      if (
        profile === 'TENTATIVE_WEAKNESS'
      ) {

        insights.push({
          type: 'neutral',

          title: `${zoneName} dikkat edilmeli`,

          text:
            `${zoneName} bölgesinde olumsuz bir sinyal var ancak örneklem kesin değerlendirme yapmak için sınırlı.`
        });

        continue;
      }


      /* ================================================
         LIMITED SAMPLE
      ================================================= */

      if (
        profile === 'LIMITED_SAMPLE' ||
        profile === 'INSUFFICIENT_SAMPLE'
      ) {

        insights.push({
          type: 'limited',

          title: `${zoneName} için veri sınırlı`,

          text:
            `${zoneName} bölgesinde güvenilir performans değerlendirmesi yapmak için yeterli şut hacmi bulunmuyor.`
        });

        continue;
      }


      /* ================================================
         POSSIBLE USAGE INSIGHT
      ================================================= */

      if (
        frequencyDiff !== null &&
        Math.abs(frequencyDiff) >= 5
      ) {

        insights.push({
          type: 'neutral',

          title: `${zoneName} kullanım farkı`,

          text:
            frequencyDiff > 0
              ? `${zoneName}, lig ortalamasına göre oyuncunun şut dağılımında daha sık kullanılıyor.`
              : `${zoneName}, lig ortalamasına göre daha az tercih ediliyor.`
        });

      }

    }


    /*
     * En anlamlı olanları üste taşı.
     */
    const priority:
      Record<CoachInsight['type'], number> = {
        warning: 0,
        positive: 1,
        neutral: 2,
        limited: 3
      };


    return insights
      .sort(
        (a, b) =>
          priority[a.type] -
          priority[b.type]
      )
      .slice(0, 5);

  });


  private readonly zonePositions: CourtZonePosition[] = [

    // Basket çevresi
    {
      zone: 'RIM',
      x: 375,
      y: 105
    },

    {
      zone: 'PAINT_NON_RIM',
      x: 375,
      y: 205
    },


    // Midrange
    {
      zone: 'LEFT_MIDRANGE',
      x: 205,
      y: 285
    },

    {
      zone: 'CENTER_MIDRANGE',
      x: 375,
      y: 330
    },

    {
      zone: 'RIGHT_MIDRANGE',
      x: 545,
      y: 285
    },


    // 3PT
    {
      zone: 'LEFT_CORNER_3',
      x: 78,
      y: 155
    },

    {
      zone: 'LEFT_WING_3',
      x: 150,
      y: 445
    },

    {
      zone: 'TOP_3',
      x: 375,
      y: 525
    },

    {
      zone: 'RIGHT_WING_3',
      x: 600,
      y: 445
    },

    {
      zone: 'RIGHT_CORNER_3',
      x: 672,
      y: 155
    }

  ];

  selectedZone =
  computed<ShotZoneAnalysis | null>(() => {

    const zones =
      this.data().zones;

    if (zones.length === 0) {
      return null;
    }

    const selected =
      this.selectedZoneName();

    if (selected) {

      const zone =
        zones.find(
          item =>
            item.shot_zone === selected
        );

      if (zone) {
        return zone;
      }
    }

    /*
     * İlk açılışta en yüksek FGA'lı
     * bölgeyi göster.
     */
    return [...zones]
      .sort(
        (a, b) =>
          b.shooting.fga -
          a.shooting.fga
      )[0];
  });


  courtZones =
    computed<CourtZoneView[]>(() => {

      const response =
        this.data();

      const zoneMap =
        new Map(
          response.zones.map(
            zone => [
              zone.shot_zone,
              zone
            ]
          )
        );


      return this.zonePositions
        .map(position => {

          const zoneData =
            zoneMap.get(
              position.zone
            );

          if (!zoneData) {
            return null;
          }


          return {
            position,
            data: zoneData
          };

        })
        .filter(
          (
            item
          ): item is CourtZoneView =>
            item !== null
        );
    });

  selectZone(
    zone: ShotZoneAnalysis
    ): void {

      this.selectedZoneName.set(
        zone.shot_zone
      );
    }

  isSelected(
  zone: ShotZoneAnalysis
): boolean {

  return (
    this.selectedZone()?.shot_zone
    ===
    zone.shot_zone
  );
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


  formatNumber(
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


  formatSignedPercent(
    value: number | null | undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    const sign =
      value > 0
        ? '+'
        : '';

    return `${sign}${value.toFixed(1)}%`;
  }


  formatZoneName(
    zone: string
  ): string {

    const names:
      Record<string, string> = {

        RIM:
          'Rim',

        PAINT_NON_RIM:
          'Paint',

        LEFT_CORNER_3:
          'Left Corner 3',

        RIGHT_CORNER_3:
          'Right Corner 3',

        LEFT_WING_3:
          'Left Wing 3',

        RIGHT_WING_3:
          'Right Wing 3',

        TOP_3:
          'Top 3',

        LEFT_MIDRANGE:
          'Left Mid',

        RIGHT_MIDRANGE:
          'Right Mid',

        CENTER_MIDRANGE:
          'Center Mid'
      };


    return (
      names[zone]
      ?? zone
    );
  }


  profileClass(
    zone: ShotZoneAnalysis
  ): string {

    const profile =
      zone.profile.zone_profile;


    if (
      profile === 'PRIMARY_STRENGTH' ||
      profile === 'STRENGTH' ||
      profile === 'POSITIVE' ||
      profile === 'UNDERUSED_STRENGTH'
    ) {
      return 'positive';
    }


    if (
      profile === 'TENTATIVE_STRENGTH' ||
      profile === 'TENTATIVE_POSITIVE'
    ) {
      return 'tentative-positive';
    }


    if (
      profile === 'WEAKNESS' ||
      profile === 'OVERUSED' ||
      profile === 'AVOID'
    ) {
      return 'negative';
    }


    if (
      profile === 'TENTATIVE_WEAKNESS'
    ) {
      return 'tentative-negative';
    }


    if (
      profile === 'LIMITED_SAMPLE' ||
      profile === 'INSUFFICIENT_SAMPLE'
    ) {
      return 'limited';
    }


    return 'neutral';
  }


  profileLabel(
    profile: string
  ): string {

    return profile
      .replaceAll('_', ' ');
  }

}