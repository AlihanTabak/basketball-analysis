from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from database import engine


router = APIRouter(
    prefix="/api/teams",
    tags=["Team Matchup Analysis"]
)


@router.get("/matchup/opponents")
def get_matchup_opponents():

    query = text("""
        SELECT DISTINCT
            teamid AS team_id,
            teamname AS team_name
        FROM tbf.teams
        WHERE seasonid = 172
        ORDER BY teamname
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [
        {
            "team_id": row["team_id"],
            "team_name": row["team_name"]
        }
        for row in rows
    ]


@router.get("/{team_id}/matchup/{opponent_team_id}")
def get_team_matchup_analysis(
    team_id: int,
    opponent_team_id: int
):

    if team_id == opponent_team_id:
        raise HTTPException(
            status_code=400,
            detail="Team and opponent cannot be the same."
        )

    # =========================================================
    # RESOLVE TEAMS
    # =========================================================

    team_query = text("""
        SELECT
            teamid AS team_id,
            teamname AS team_name
        FROM tbf.teams
        WHERE teamid = :team_id
          AND seasonid = 172
        LIMIT 1
    """)

    opponent_query = text("""
        SELECT
            teamid AS team_id,
            teamname AS team_name
        FROM tbf.teams
        WHERE teamid = :opponent_team_id
          AND seasonid = 172
        LIMIT 1
    """)

    with engine.connect() as connection:

        team_row = connection.execute(
            team_query,
            {"team_id": team_id}
        ).mappings().first()

        opponent_row = connection.execute(
            opponent_query,
            {"opponent_team_id": opponent_team_id}
        ).mappings().first()

        if not team_row:
            raise HTTPException(
                status_code=404,
                detail="Team not found."
            )

        if not opponent_row:
            raise HTTPException(
                status_code=404,
                detail="Opponent team not found."
            )

        team_name = team_row["team_name"]
        opponent_team_name = opponent_row["team_name"]

        # =====================================================
        # MATCHUP DATA
        # =====================================================

        matchup_query = text("""
            SELECT
                *
            FROM analytics.team_matchup_zone_profile
            WHERE TRIM(offensive_team_name) = TRIM(:team_name)
              AND TRIM(defensive_team_name) = TRIM(:opponent_team_name)
            ORDER BY
                CASE matchup_profile
                    WHEN 'PRIMARY_ATTACK' THEN 1
                    WHEN 'ATTACK' THEN 2
                    WHEN 'EFFICIENCY_OPPORTUNITY' THEN 3
                    WHEN 'VOLUME_OPPORTUNITY' THEN 4
                    WHEN 'ACCESS_OPPORTUNITY' THEN 5
                    WHEN 'NEUTRAL' THEN 6
                    WHEN 'LOW_ACCESS' THEN 7
                    WHEN 'TEMPTATION' THEN 8
                    WHEN 'DIFFICULT' THEN 9
                    WHEN 'AVOID' THEN 10
                    ELSE 11
                END,
                efficiency_matchup_edge DESC
        """)

        rows = connection.execute(
            matchup_query,
            {
                "team_name": team_name,
                "opponent_team_name": opponent_team_name
            }
        ).mappings().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Matchup analysis not found."
        )

    # =========================================================
    # SUMMARY
    # =========================================================

    primary_attacks = []
    attacks = []

    efficiency_opportunities = []
    volume_opportunities = []
    access_opportunities = []

    temptations = []
    low_access = []

    difficult = []
    avoid = []

    zones = []

    for row in rows:

        profile = row["matchup_profile"]
        shot_zone = row["shot_zone"]

        if profile == "PRIMARY_ATTACK":
            primary_attacks.append(shot_zone)

        elif profile == "ATTACK":
            attacks.append(shot_zone)

        elif profile == "EFFICIENCY_OPPORTUNITY":
            efficiency_opportunities.append(shot_zone)

        elif profile == "VOLUME_OPPORTUNITY":
            volume_opportunities.append(shot_zone)

        elif profile == "ACCESS_OPPORTUNITY":
            access_opportunities.append(shot_zone)

        elif profile == "TEMPTATION":
            temptations.append(shot_zone)

        elif profile == "LOW_ACCESS":
            low_access.append(shot_zone)

        elif profile == "DIFFICULT":
            difficult.append(shot_zone)

        elif profile == "AVOID":
            avoid.append(shot_zone)

        # =====================================================
        # ZONE RESPONSE
        # =====================================================

        zones.append({

            "shot_zone": shot_zone,

            "offense": {

                "fga": row["offense_fga"],
                "fgm": row["offense_fgm"],

                "fg_pct": row["offense_fg_pct"],

                "league_fg_pct": row["league_fg_pct"],

                "fg_pct_diff":
                    row["offense_fg_pct_diff"],

                "performance_percentile":
                    row["offense_performance_percentile"],

                "performance_level":
                    row["offense_performance_level"],


                "shot_frequency_pct":
                    row["offense_shot_frequency_pct"],

                "league_shot_frequency_pct":
                    row["league_shot_frequency_pct"],

                "frequency_diff":
                    row["offense_frequency_diff"],

                "frequency_percentile":
                    row["offense_frequency_percentile"],

                "volume_level":
                    row["offense_volume_level"],


                "points_per_shot":
                    row["offense_points_per_shot"],

                "league_points_per_shot":
                    row["league_points_per_shot"],

                "points_per_shot_diff":
                    row["offense_points_per_shot_diff"],


                "zone_profile":
                    row["offense_zone_profile"]
            },

            "defense": {

                "opp_fga":
                    row["opp_fga"],

                "opp_fgm":
                    row["opp_fgm"],

                "opp_fg_pct":
                    row["opp_fg_pct"],

                "opp_fg_pct_diff":
                    row["opp_fg_pct_diff"],


                "shot_defense_percentile":
                    row["shot_defense_percentile"],

                "shot_defense_level":
                    row["shot_defense_level"],


                "opp_shot_frequency_pct":
                    row["opp_shot_frequency_pct"],

                "frequency_diff":
                    row["defense_frequency_diff"],

                "suppression_percentile":
                    row["suppression_percentile"],

                "suppression_level":
                    row["suppression_level"],


                "opp_points_per_shot":
                    row["opp_points_per_shot"],

                "points_per_shot_diff":
                    row["defense_points_per_shot_diff"],


                "zone_profile":
                    row["defense_zone_profile"]
            },

            "matchup": {

                "efficiency_edge":
                    row["efficiency_matchup_edge"],

                "access_edge":
                    row["access_matchup_edge"],

                "profile":
                    row["matchup_profile"]
            }

        })

    return {

        "team": {
            "team_id": team_row["team_id"],
            "team_name": team_row["team_name"]
        },

        "opponent": {
            "team_id": opponent_row["team_id"],
            "team_name": opponent_row["team_name"]
        },

        "summary": {

            "primary_attacks":
                primary_attacks,

            "attacks":
                attacks,

            "efficiency_opportunities":
                efficiency_opportunities,

            "volume_opportunities":
                volume_opportunities,

            "access_opportunities":
                access_opportunities,

            "temptations":
                temptations,

            "low_access":
                low_access,

            "difficult":
                difficult,

            "avoid":
                avoid
        },

        "zones": zones
    }