import {
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

import {
  MatchupOpponent,
  Team,
  TeamDefenseShotZone,
  TeamMatchupAnalysisResponse,
  TeamMatchupZone,
  TeamOffenseShotZone,
  TeamShotAnalysisResponse
} from '../../services/team';


type AnalysisMode =
  | 'offense'
  | 'defense'
  | 'matchup';


interface CourtZonePosition {
  zone: string;
  x: number;
  y: number;
}


interface OffenseCourtZoneView {
  position: CourtZonePosition;
  data: TeamOffenseShotZone;
}


interface DefenseCourtZoneView {
  position: CourtZonePosition;
  data: TeamDefenseShotZone;
}


interface MatchupCourtZoneView {
  position: CourtZonePosition;
  data: TeamMatchupZone;
}


interface CoachInsight {
  type:
    | 'positive'
    | 'warning'
    | 'neutral';

  title: string;
  text: string;
}


@Component({
  selector: 'app-team-shot-analysis',
  standalone: true,
  imports: [],
  templateUrl: './team-shot-analysis.html',
  styleUrl: './team-shot-analysis.scss'
})
export class TeamShotAnalysis {

  private readonly teamService =
    inject(Team);


  data =
    input.required<TeamShotAnalysisResponse>();


  mode =
    signal<AnalysisMode>('offense');


  selectedZoneName =
    signal<string | null>(null);


  /* =========================================================
     MATCHUP STATE
     ========================================================= */

  opponents =
    signal<MatchupOpponent[]>([]);


  selectedOpponentId =
    signal<number | null>(null);


  matchupAnalysis =
    signal<TeamMatchupAnalysisResponse | null>(
      null
    );


  matchupLoading =
    signal<boolean>(false);


  matchupError =
    signal<string | null>(null);


  opponentsLoading =
    signal<boolean>(false);


  private readonly zonePositions:
    CourtZonePosition[] = [

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
     OFFENSE COURT
     ========================================================= */

  offenseZones =
    computed<OffenseCourtZoneView[]>(
      () => {

        const zones =
          this.data().offense.zones;

        return this.zonePositions
          .map(position => {

            const zone =
              zones.find(
                item =>
                  item.shot_zone ===
                  position.zone
              );

            if (!zone) {
              return null;
            }

            return {
              position,
              data: zone
            };
          })
          .filter(
            (
              item
            ): item is OffenseCourtZoneView =>
              item !== null
          );
      }
    );


  /* =========================================================
     DEFENSE COURT
     ========================================================= */

  defenseZones =
    computed<DefenseCourtZoneView[]>(
      () => {

        const zones =
          this.data().defense.zones;

        return this.zonePositions
          .map(position => {

            const zone =
              zones.find(
                item =>
                  item.shot_zone ===
                  position.zone
              );

            if (!zone) {
              return null;
            }

            return {
              position,
              data: zone
            };
          })
          .filter(
            (
              item
            ): item is DefenseCourtZoneView =>
              item !== null
          );
      }
    );


  /* =========================================================
     MATCHUP COURT
     ========================================================= */

  matchupZones =
    computed<MatchupCourtZoneView[]>(
      () => {

        const matchup =
          this.matchupAnalysis();

        if (!matchup) {
          return [];
        }

        return this.zonePositions
          .map(position => {

            const zone =
              matchup.zones.find(
                item =>
                  item.shot_zone ===
                  position.zone
              );

            if (!zone) {
              return null;
            }

            return {
              position,
              data: zone
            };
          })
          .filter(
            (
              item
            ): item is MatchupCourtZoneView =>
              item !== null
          );
      }
    );


  /* =========================================================
     SELECTED OFFENSE ZONE
     ========================================================= */

  selectedOffenseZone =
    computed<TeamOffenseShotZone | null>(
      () => {

        if (
          this.mode() !== 'offense'
        ) {
          return null;
        }

        const zones =
          this.data().offense.zones;

        const selected =
          this.selectedZoneName();

        if (selected) {

          return (
            zones.find(
              zone =>
                zone.shot_zone ===
                selected
            ) ?? null
          );
        }

        return (
          [...zones]
            .sort(
              (a, b) =>
                b.shooting.fga -
                a.shooting.fga
            )[0]
          ?? null
        );
      }
    );


  /* =========================================================
     SELECTED DEFENSE ZONE
     ========================================================= */

  selectedDefenseZone =
    computed<TeamDefenseShotZone | null>(
      () => {

        if (
          this.mode() !== 'defense'
        ) {
          return null;
        }

        const zones =
          this.data().defense.zones;

        const selected =
          this.selectedZoneName();

        if (selected) {

          return (
            zones.find(
              zone =>
                zone.shot_zone ===
                selected
            ) ?? null
          );
        }

        return (
          [...zones]
            .sort(
              (a, b) =>
                b.shot_defense.opp_fga -
                a.shot_defense.opp_fga
            )[0]
          ?? null
        );
      }
    );


  /* =========================================================
     SELECTED MATCHUP ZONE
     ========================================================= */

  selectedMatchupZone =
    computed<TeamMatchupZone | null>(
      () => {

        if (
          this.mode() !== 'matchup'
        ) {
          return null;
        }

        const matchup =
          this.matchupAnalysis();

        if (!matchup) {
          return null;
        }

        const zones =
          matchup.zones;

        const selected =
          this.selectedZoneName();

        if (selected) {

          return (
            zones.find(
              zone =>
                zone.shot_zone ===
                selected
            ) ?? null
          );
        }

        /*
         * Backend already returns the zones ordered
         * by matchup importance.
         */
        return zones[0] ?? null;
      }
    );


  /* =========================================================
     OFFENSE COACH INSIGHTS
     ========================================================= */

  offenseInsights =
    computed<CoachInsight[]>(
      () => {

        const insights:
          CoachInsight[] = [];

        for (
          const zone
          of this.data().offense.zones
        ) {

          const profile =
            zone.profile.zone_profile;

          const zoneName =
            this.formatZoneName(
              zone.shot_zone
            );

          const fgDiff =
            zone.shooting.fg_pct_diff;

          const frequencyDiff =
            zone.usage.frequency_diff;


          if (
            profile ===
            'PRIMARY_STRENGTH'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} primary strength`,
              text:
                `High-volume and elite efficiency zone. ` +
                `The team is producing one of its strongest offensive advantages here.`
            });

            continue;
          }


          if (
            profile === 'STRENGTH' ||
            profile === 'POSITIVE'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} is efficient`,
              text:
                fgDiff !== null
                  ? `FG% is ${this.formatSignedPoint(fgDiff)} versus league average.`
                  : `This zone is performing efficiently relative to the league.`
            });

            continue;
          }


          if (
            profile ===
            'UNDERUSED_STRENGTH'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} can be used more`,
              text:
                `Efficiency is strong, but shot volume is low relative to the league.`
            });

            continue;
          }


          if (
            profile ===
            'OPPORTUNITY'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} opportunity`,
              text:
                `The team is efficient here without using the zone heavily.`
            });

            continue;
          }


          if (
            profile ===
            'OVERUSED'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} is overused`,
              text:
                fgDiff !== null
                  ? `High usage despite shooting ${Math.abs(fgDiff).toFixed(1)} points below league average.`
                  : `Shot volume is high relative to the efficiency produced.`
            });

            continue;
          }


          if (
            profile ===
            'OVERUSED_AVERAGE'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} volume concern`,
              text:
                `The team takes a high share of shots here despite only average efficiency.`
            });

            continue;
          }


          if (
            profile === 'WEAKNESS' ||
            profile === 'AVOID'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} offensive weakness`,
              text:
                `Efficiency in this zone is poor relative to the league.`
            });

            continue;
          }


          if (
            frequencyDiff !== null &&
            Math.abs(
              frequencyDiff
            ) >= 4
          ) {

            insights.push({
              type: 'neutral',
              title:
                `${zoneName} shot diet`,
              text:
                frequencyDiff > 0
                  ? `The team takes ${frequencyDiff.toFixed(1)} percentage points more shots here than league average.`
                  : `The team takes ${Math.abs(frequencyDiff).toFixed(1)} percentage points fewer shots here than league average.`
            });
          }
        }


        return insights
          .sort(
            (a, b) =>
              this.insightPriority(
                a.type
              ) -
              this.insightPriority(
                b.type
              )
          )
          .slice(
            0,
            5
          );
      }
    );


  /* =========================================================
     DEFENSE COACH INSIGHTS
     ========================================================= */

  defenseInsights =
    computed<CoachInsight[]>(
      () => {

        const insights:
          CoachInsight[] = [];

        for (
          const zone
          of this.data().defense.zones
        ) {

          const profile =
            zone.profile.zone_profile;

          const zoneName =
            this.formatZoneName(
              zone.shot_zone
            );

          const fgDiff =
            zone.shot_defense
              .opp_fg_pct_diff;

          const frequencyDiff =
            zone.suppression
              .frequency_diff;


          if (
            profile ===
            'PRIMARY_DEFENSIVE_STRENGTH'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} defensive anchor`,
              text:
                `The team both limits attempts and suppresses opponent efficiency in this zone.`
            });

            continue;
          }


          if (
            profile ===
              'DEFENSIVE_STRENGTH' ||
            profile ===
              'CONTAINMENT_STRENGTH'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} defended well`,
              text:
                fgDiff !== null
                  ? `Opponents shoot ${Math.abs(fgDiff).toFixed(1)} points ${fgDiff < 0 ? 'below' : 'above'} league average here.`
                  : `Opponent efficiency is well controlled in this zone.`
            });

            continue;
          }


          if (
            profile ===
            'CONTAINMENT_POSITIVE'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} containment positive`,
              text:
                `Opponent efficiency is controlled even though shot suppression is limited.`
            });

            continue;
          }


          if (
            profile ===
            'SUPPRESSION_STRENGTH'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} suppressed`,
              text:
                frequencyDiff !== null
                  ? `Opponents take ${Math.abs(frequencyDiff).toFixed(1)} percentage points fewer shots here than league average.`
                  : `The defense is effective at keeping opponents away from this zone.`
            });

            continue;
          }


          if (
            profile ===
            'VOLUME_CONCERN'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} volume concern`,
              text:
                `Opponents reach this zone more often than desired.`
            });

            continue;
          }


          if (
            profile ===
            'EFFICIENCY_CONCERN'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} efficiency concern`,
              text:
                fgDiff !== null
                  ? `Opponents shoot ${fgDiff.toFixed(1)} points above league average when they reach this zone.`
                  : `Opponent finishing efficiency is a concern here.`
            });

            continue;
          }


          if (
            profile ===
            'DEFENSIVE_WEAKNESS'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} defensive weakness`,
              text:
                `Opponent efficiency is poor from the defense's perspective in this zone.`
            });

            continue;
          }


          if (
            profile ===
            'PRIMARY_DEFENSIVE_WEAKNESS'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} primary weakness`,
              text:
                `The defense struggles both with opponent efficiency and shot suppression here.`
            });

            continue;
          }
        }


        return insights
          .sort(
            (a, b) =>
              this.insightPriority(
                a.type
              ) -
              this.insightPriority(
                b.type
              )
          )
          .slice(
            0,
            5
          );
      }
    );


  /* =========================================================
     MATCHUP COACH INSIGHTS
     ========================================================= */

  matchupInsights =
    computed<CoachInsight[]>(
      () => {

        const matchup =
          this.matchupAnalysis();

        if (!matchup) {
          return [];
        }

        const insights:
          CoachInsight[] = [];

        for (
          const zone
          of matchup.zones
        ) {

          const profile =
            zone.matchup.profile;

          const zoneName =
            this.formatZoneName(
              zone.shot_zone
            );

          const efficiencyEdge =
            zone.matchup.efficiency_edge;

          const accessEdge =
            zone.matchup.access_edge;


          if (
            profile ===
            'PRIMARY_ATTACK'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} primary attack`,
              text:
                `Both efficiency and access favor the offense. This is one of the clearest zones to prioritize in the matchup.`
            });

            continue;
          }


          if (
            profile === 'ATTACK'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} attack`,
              text:
                efficiencyEdge !== null
                  ? `The efficiency matchup favors the offense by ${this.formatSignedPoint(efficiencyEdge)} in percentile edge.`
                  : `The efficiency matchup favors the offense in this zone.`
            });

            continue;
          }


          if (
            profile ===
            'EFFICIENCY_OPPORTUNITY'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} efficiency opportunity`,
              text:
                `The offense has an efficiency advantage here, but the opponent is effective at limiting access. Create actions that force this zone open.`
            });

            continue;
          }


          if (
            profile ===
            'VOLUME_OPPORTUNITY'
          ) {

            insights.push({
              type: 'positive',
              title:
                `${zoneName} volume opportunity`,
              text:
                `This is a productive offensive zone and the matchup suggests it can be reached more often.`
            });

            continue;
          }


          if (
            profile ===
            'ACCESS_OPPORTUNITY'
          ) {

            insights.push({
              type: 'neutral',
              title:
                `${zoneName} access opportunity`,
              text:
                `The opponent appears willing to concede access here, although the efficiency advantage is not decisive.`
            });

            continue;
          }


          if (
            profile ===
            'TEMPTATION'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} temptation`,
              text:
                `The opponent may concede this area, but it is a poor offensive zone for the team. Do not confuse availability with shot quality.`
            });

            continue;
          }


          if (
            profile ===
            'LOW_ACCESS'
          ) {

            insights.push({
              type: 'neutral',
              title:
                `${zoneName} limited access`,
              text:
                accessEdge !== null
                  ? `The matchup access edge is ${this.formatSignedPoint(accessEdge)}. The opponent tends to restrict this area.`
                  : `The opponent tends to restrict access to this area.`
            });

            continue;
          }


          if (
            profile ===
            'DIFFICULT'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} difficult matchup`,
              text:
                `The efficiency matchup strongly favors the defense in this zone.`
            });

            continue;
          }


          if (
            profile ===
            'AVOID'
          ) {

            insights.push({
              type: 'warning',
              title:
                `${zoneName} avoid`,
              text:
                `Both efficiency and access favor the defense. This is one of the least attractive zones in the matchup.`
            });

            continue;
          }
        }


        return insights
          .sort(
            (a, b) =>
              this.insightPriority(
                a.type
              ) -
              this.insightPriority(
                b.type
              )
          )
          .slice(
            0,
            5
          );
      }
    );


  /* =========================================================
     MODE
     ========================================================= */

  setMode(
    mode: AnalysisMode
  ): void {

    this.mode.set(mode);

    this.selectedZoneName.set(
      null
    );

    if (
      mode === 'matchup' &&
      this.opponents().length === 0 &&
      !this.opponentsLoading()
    ) {
      this.loadOpponents();
    }
  }


  /* =========================================================
     OPPONENTS
     ========================================================= */

  loadOpponents(): void {

    this.opponentsLoading.set(
      true
    );

    this.teamService
      .getMatchupOpponents()
      .subscribe({

        next: opponents => {

          const currentTeamId =
            this.data().team.team_id;

          const availableOpponents =
            opponents.filter(
              opponent =>
                opponent.team_id !==
                currentTeamId
            );

          this.opponents.set(
            availableOpponents
          );

          this.opponentsLoading.set(
            false
          );
        },

        error: error => {

          console.error(
            'Opponent list could not be loaded',
            error
          );

          this.opponentsLoading.set(
            false
          );

          this.matchupError.set(
            'Opponent list could not be loaded.'
          );
        }

      });
  }


  selectOpponent(
    opponentId: number
  ): void {

    if (
      !opponentId ||
      opponentId ===
        this.data().team.team_id
    ) {
      return;
    }

    this.selectedOpponentId.set(
      opponentId
    );

    this.loadMatchup(
      opponentId
    );
  }


  loadMatchup(
    opponentId: number
  ): void {

    const teamId =
      this.data().team.team_id;

    this.matchupLoading.set(
      true
    );

    this.matchupError.set(
      null
    );

    this.selectedZoneName.set(
      null
    );

    this.teamService
      .getMatchupAnalysis(
        teamId,
        opponentId
      )
      .subscribe({

        next: matchup => {

          this.matchupAnalysis.set(
            matchup
          );

          this.matchupLoading.set(
            false
          );
        },

        error: error => {

          console.error(
            'Matchup analysis could not be loaded',
            error
          );

          this.matchupAnalysis.set(
            null
          );

          this.matchupLoading.set(
            false
          );

          this.matchupError.set(
            'Matchup analysis could not be loaded.'
          );
        }

      });
  }


  /* =========================================================
     ZONE SELECTION
     ========================================================= */

  selectZone(
    zone: string
  ): void {

    this.selectedZoneName.set(
      zone
    );
  }


  isSelected(
    zone: string
  ): boolean {

    const selected =
      this.selectedZoneName();

    if (selected) {

      return (
        selected === zone
      );
    }

    if (
      this.mode() === 'offense'
    ) {

      return (
        this.selectedOffenseZone()
          ?.shot_zone === zone
      );
    }

    if (
      this.mode() === 'defense'
    ) {

      return (
        this.selectedDefenseZone()
          ?.shot_zone === zone
      );
    }

    return (
      this.selectedMatchupZone()
        ?.shot_zone === zone
    );
  }


  /* =========================================================
     PROFILE CLASSES
     ========================================================= */

  offenseProfileClass(
    zone: TeamOffenseShotZone
  ): string {

    const profile =
      zone.profile.zone_profile;

    if (
      profile === 'PRIMARY_STRENGTH' ||
      profile === 'STRENGTH' ||
      profile === 'POSITIVE' ||
      profile === 'UNDERUSED_STRENGTH' ||
      profile === 'OPPORTUNITY'
    ) {
      return 'positive';
    }

    if (
      profile === 'OVERUSED' ||
      profile === 'WEAKNESS' ||
      profile === 'AVOID'
    ) {
      return 'negative';
    }

    if (
      profile ===
      'OVERUSED_AVERAGE'
    ) {
      return 'warning';
    }

    return 'neutral';
  }


  defenseProfileClass(
    zone: TeamDefenseShotZone
  ): string {

    const profile =
      zone.profile.zone_profile;

    if (
      profile ===
        'PRIMARY_DEFENSIVE_STRENGTH' ||
      profile ===
        'DEFENSIVE_STRENGTH' ||
      profile ===
        'CONTAINMENT_STRENGTH' ||
      profile ===
        'CONTAINMENT_POSITIVE' ||
      profile ===
        'SUPPRESSION_STRENGTH'
    ) {
      return 'positive';
    }

    if (
      profile ===
        'PRIMARY_DEFENSIVE_WEAKNESS' ||
      profile ===
        'DEFENSIVE_WEAKNESS'
    ) {
      return 'negative';
    }

    if (
      profile ===
        'VOLUME_CONCERN' ||
      profile ===
        'EFFICIENCY_CONCERN'
    ) {
      return 'warning';
    }

    return 'neutral';
  }


  matchupProfileClass(
    zone: TeamMatchupZone
  ): string {

    const profile =
      zone.matchup.profile;

    if (
      profile === 'PRIMARY_ATTACK' ||
      profile === 'ATTACK' ||
      profile ===
        'EFFICIENCY_OPPORTUNITY' ||
      profile ===
        'VOLUME_OPPORTUNITY'
    ) {
      return 'positive';
    }

    if (
      profile === 'DIFFICULT' ||
      profile === 'AVOID'
    ) {
      return 'negative';
    }

    if (
      profile === 'TEMPTATION'
    ) {
      return 'warning';
    }

    return 'neutral';
  }


  /* =========================================================
     FORMATTERS
     ========================================================= */

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
      names[zone] ??
      zone
    );
  }


  formatPercent(
    value:
      number |
      null |
      undefined
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
    value:
      number |
      null |
      undefined,
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


  formatSignedPoint(
    value:
      number |
      null |
      undefined
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

    return `${sign}${value.toFixed(1)} pts`;
  }


  formatPercentile(
    value:
      number |
      null |
      undefined
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return `P${Math.round(value)}`;
  }

  courtZoneLabel(
  zone: string
): string {

  const names: Record<string, string> = {
    RIM: 'RIM',
    PAINT_NON_RIM: 'PAINT',

    LEFT_CORNER_3: 'L CORNER',
    RIGHT_CORNER_3: 'R CORNER',

    LEFT_WING_3: 'L WING',
    RIGHT_WING_3: 'R WING',

    TOP_3: 'TOP 3',

    LEFT_MIDRANGE: 'L MID',
    RIGHT_MIDRANGE: 'R MID',
    CENTER_MIDRANGE: 'C MID'
  };

  return names[zone] ?? zone;
}


  profileLabel(
    profile: string
  ): string {

    return profile
      .replaceAll(
        '_',
        ' '
      );
  }


  private insightPriority(
    type: CoachInsight['type']
  ): number {

    if (
      type === 'warning'
    ) {
      return 0;
    }

    if (
      type === 'positive'
    ) {
      return 1;
    }

    return 2;
  }

}