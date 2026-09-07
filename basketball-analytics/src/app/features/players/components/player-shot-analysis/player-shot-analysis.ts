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


  /* =========================================================
     COACH INSIGHTS
     ========================================================= */

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

            title:
              `${zoneName} is a strength`,

            text:
              `${zoneName} combines strong efficiency with high shot volume.`
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

            title:
              `${zoneName} is performing well`,

            text:
              fgDiff !== null
                ? `${zoneName} FG% is ${Math.abs(fgDiff).toFixed(1)} percentage points above the league average.`
                : `${zoneName} shows a positive shooting profile.`
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

            title:
              `${zoneName} could be used more`,

            text:
              `${zoneName} is an efficient shooting area but currently represents a relatively small share of the player's shot diet.`
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

            title:
              `${zoneName} presents an opportunity`,

            text:
              `${zoneName} shows positive performance and may support a higher usage level.`
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

            title:
              `${zoneName} may be overused`,

            text:
              fgDiff !== null
                ? `${zoneName} is used at high volume, but FG% is ${Math.abs(fgDiff).toFixed(1)} percentage points below the league average.`
                : `${zoneName} is used frequently despite below-average efficiency.`
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

            title:
              `${zoneName} is a weakness`,

            text:
              fgDiff !== null
                ? `${zoneName} FG% is ${Math.abs(fgDiff).toFixed(1)} percentage points below the league average.`
                : `${zoneName} shows below-average shooting efficiency.`
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

            title:
              `${zoneName} is a low-value area`,

            text:
              `${zoneName} combines low usage with low shooting efficiency.`
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

            title:
              `${zoneName} shows a positive signal`,

            text:
              `${zoneName} shows encouraging performance, but the sample size is still too limited for a strong conclusion.`
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

            title:
              `${zoneName} deserves attention`,

            text:
              `${zoneName} shows a negative signal, but the sample size is too limited for a definitive evaluation.`
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

            title:
              `${zoneName} has limited data`,

            text:
              `${zoneName} does not have enough shot volume for a reliable performance evaluation.`
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

            title:
              `${zoneName} usage differs from the league`,

            text:
              frequencyDiff > 0
                ? `${zoneName} represents a larger share of the player's shot diet than the league average.`
                : `${zoneName} is used less frequently than the league average.`
          });

        }

      }


      /*
       * Move the most actionable insights
       * to the top.
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


  /* =========================================================
     COURT POSITIONS
     ========================================================= */

  private readonly zonePositions:
    CourtZonePosition[] = [

      // Rim area
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


      // Three-point areas
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


  /* =========================================================
     SELECTED ZONE
     ========================================================= */

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
       * On initial load, show the zone
       * with the highest FGA.
       */

      return [...zones]
        .sort(
          (a, b) =>
            b.shooting.fga -
            a.shooting.fga
        )[0];

    });


  /* =========================================================
     COURT ZONES
     ========================================================= */

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


  /* =========================================================
     INTERACTIONS
     ========================================================= */

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


  /* =========================================================
     FORMAT HELPERS
     ========================================================= */

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

    return value.toFixed(
      decimals
    );

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
          'Left Midrange',

        RIGHT_MIDRANGE:
          'Right Midrange',

        CENTER_MIDRANGE:
          'Center Midrange'

      };


    return (
      names[zone]
      ?? zone
    );

  }


  /* =========================================================
     PROFILE CLASS
     ========================================================= */

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


  /* =========================================================
     PROFILE LABEL
     ========================================================= */

  profileLabel(
    profile: string
  ): string {

    const labels:
      Record<string, string> = {

        PRIMARY_STRENGTH:
          'Primary Strength',

        STRENGTH:
          'Strength',

        POSITIVE:
          'Positive',

        UNDERUSED_STRENGTH:
          'Underused Strength',

        OPPORTUNITY:
          'Opportunity',

        OVERUSED:
          'Overused',

        WEAKNESS:
          'Weakness',

        AVOID:
          'Avoid',

        TENTATIVE_STRENGTH:
          'Tentative Strength',

        TENTATIVE_POSITIVE:
          'Tentative Positive',

        TENTATIVE_WEAKNESS:
          'Tentative Weakness',

        LIMITED_SAMPLE:
          'Limited Sample',

        INSUFFICIENT_SAMPLE:
          'Insufficient Sample',

        NEUTRAL:
          'Neutral'

      };


    return (
      labels[profile]
      ??
      profile.replaceAll(
        '_',
        ' '
      )
    );

  }

}