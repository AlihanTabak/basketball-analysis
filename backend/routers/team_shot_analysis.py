from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from database import engine


router = APIRouter(
    prefix="/api/teams",
    tags=["Team Shot Analysis"]
)


@router.get("/{team_id}/shot-analysis")
def get_team_shot_analysis(team_id: int):

    # ---------------------------------------------------------
    # 1. TEAM ID -> TEAM NAME
    # ---------------------------------------------------------

    team_query = text("""
        SELECT
            teamid AS team_id,
            teamname AS team_name
        FROM tbf.teams
        WHERE teamid = :team_id
          AND seasonid = 172
        LIMIT 1
    """)

    with engine.connect() as conn:
        team_row = conn.execute(
            team_query,
            {"team_id": team_id}
        ).mappings().first()

        if not team_row:
            raise HTTPException(
                status_code=404,
                detail="Team not found"
            )

        team_name = team_row["team_name"]

        # -----------------------------------------------------
        # 2. OFFENSIVE SHOT PROFILE
        # -----------------------------------------------------

        offense_query = text("""
            SELECT
                shot_zone,

                fga,
                fgm,

                fg_pct,
                league_fg_pct,
                fg_pct_diff,

                performance_percentile,
                performance_level,

                shot_frequency_pct,
                league_shot_frequency_pct,
                frequency_diff,

                frequency_percentile,
                volume_level,

                points,
                points_per_shot,
                league_points_per_shot,
                points_per_shot_diff,

                zone_profile

            FROM analytics.team_shot_profile

            WHERE TRIM(team_name) = TRIM(:team_name)

            ORDER BY fga DESC
        """)

        offense_rows = conn.execute(
            offense_query,
            {"team_name": team_name}
        ).mappings().all()

        # -----------------------------------------------------
        # 3. DEFENSIVE SHOT PROFILE
        # -----------------------------------------------------

        defense_query = text("""
            SELECT
                shot_zone,

                opp_fga,
                opp_fgm,

                opp_fg_pct,
                league_fg_pct,
                opp_fg_pct_diff,

                shot_defense_percentile,
                shot_defense_level,

                opp_shot_frequency_pct,
                league_shot_frequency_pct,
                opp_frequency_diff,

                suppression_percentile,
                suppression_level,

                opp_points,
                opp_points_per_shot,
                league_points_per_shot,
                opp_points_per_shot_diff,

                defensive_zone_profile

            FROM analytics.team_defensive_shot_profile

            WHERE TRIM(team_name) = TRIM(:team_name)

            ORDER BY opp_fga DESC
        """)

        defense_rows = conn.execute(
            defense_query,
            {"team_name": team_name}
        ).mappings().all()

    if not offense_rows and not defense_rows:
        raise HTTPException(
            status_code=404,
            detail="Shot analysis data not found for team"
        )

    # ---------------------------------------------------------
    # 4. OFFENSE SUMMARY
    # ---------------------------------------------------------

    offense_summary = {
        "total_fga": sum(
            int(row["fga"] or 0)
            for row in offense_rows
        ),

        "primary_strengths": [
            row["shot_zone"]
            for row in offense_rows
            if row["zone_profile"] == "PRIMARY_STRENGTH"
        ],

        "strengths": [
            row["shot_zone"]
            for row in offense_rows
            if row["zone_profile"] in (
                "STRENGTH",
                "POSITIVE",
                "UNDERUSED_STRENGTH"
            )
        ],

        "opportunities": [
            row["shot_zone"]
            for row in offense_rows
            if row["zone_profile"] == "OPPORTUNITY"
        ],

        "overused": [
            row["shot_zone"]
            for row in offense_rows
            if row["zone_profile"] in (
                "OVERUSED",
                "OVERUSED_AVERAGE"
            )
        ],

        "weaknesses": [
            row["shot_zone"]
            for row in offense_rows
            if row["zone_profile"] in (
                "WEAKNESS",
                "AVOID"
            )
        ]
    }

    # ---------------------------------------------------------
    # 5. DEFENSE SUMMARY
    # ---------------------------------------------------------

    defense_summary = {
        "total_opp_fga": sum(
            int(row["opp_fga"] or 0)
            for row in defense_rows
        ),

        "primary_strengths": [
            row["shot_zone"]
            for row in defense_rows
            if row["defensive_zone_profile"]
            == "PRIMARY_DEFENSIVE_STRENGTH"
        ],

        "strengths": [
            row["shot_zone"]
            for row in defense_rows
            if row["defensive_zone_profile"] in (
                "DEFENSIVE_STRENGTH",
                "CONTAINMENT_STRENGTH",
                "CONTAINMENT_POSITIVE",
                "SUPPRESSION_STRENGTH"
            )
        ],

        "concerns": [
            row["shot_zone"]
            for row in defense_rows
            if row["defensive_zone_profile"] in (
                "VOLUME_CONCERN",
                "EFFICIENCY_CONCERN"
            )
        ],

        "weaknesses": [
            row["shot_zone"]
            for row in defense_rows
            if row["defensive_zone_profile"] in (
                "DEFENSIVE_WEAKNESS",
                "PRIMARY_DEFENSIVE_WEAKNESS"
            )
        ]
    }

    # ---------------------------------------------------------
    # 6. SERIALIZE OFFENSE
    # ---------------------------------------------------------

    offense = []

    for row in offense_rows:
        offense.append({
            "shot_zone": row["shot_zone"],

            "shooting": {
                "fga": row["fga"],
                "fgm": row["fgm"],
                "fg_pct": row["fg_pct"],
                "league_fg_pct": row["league_fg_pct"],
                "fg_pct_diff": row["fg_pct_diff"],
                "performance_percentile":
                    row["performance_percentile"],
                "performance_level":
                    row["performance_level"]
            },

            "usage": {
                "shot_frequency_pct":
                    row["shot_frequency_pct"],
                "league_shot_frequency_pct":
                    row["league_shot_frequency_pct"],
                "frequency_diff":
                    row["frequency_diff"],
                "frequency_percentile":
                    row["frequency_percentile"],
                "volume_level":
                    row["volume_level"]
            },

            "scoring": {
                "points": row["points"],
                "points_per_shot":
                    row["points_per_shot"],
                "league_points_per_shot":
                    row["league_points_per_shot"],
                "points_per_shot_diff":
                    row["points_per_shot_diff"]
            },

            "profile": {
                "zone_profile":
                    row["zone_profile"]
            }
        })

    # ---------------------------------------------------------
    # 7. SERIALIZE DEFENSE
    # ---------------------------------------------------------

    defense = []

    for row in defense_rows:
        defense.append({
            "shot_zone": row["shot_zone"],

            "shot_defense": {
                "opp_fga": row["opp_fga"],
                "opp_fgm": row["opp_fgm"],
                "opp_fg_pct": row["opp_fg_pct"],
                "league_fg_pct": row["league_fg_pct"],
                "opp_fg_pct_diff":
                    row["opp_fg_pct_diff"],
                "percentile":
                    row["shot_defense_percentile"],
                "level":
                    row["shot_defense_level"]
            },

            "suppression": {
                "opp_shot_frequency_pct":
                    row["opp_shot_frequency_pct"],
                "league_shot_frequency_pct":
                    row["league_shot_frequency_pct"],
                "frequency_diff":
                    row["opp_frequency_diff"],
                "percentile":
                    row["suppression_percentile"],
                "level":
                    row["suppression_level"]
            },

            "scoring": {
                "opp_points":
                    row["opp_points"],
                "opp_points_per_shot":
                    row["opp_points_per_shot"],
                "league_points_per_shot":
                    row["league_points_per_shot"],
                "points_per_shot_diff":
                    row["opp_points_per_shot_diff"]
            },

            "profile": {
                "zone_profile":
                    row["defensive_zone_profile"]
            }
        })

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "team": {
            "team_id": team_id,
            "team_name": team_name
        },

        "offense": {
            "summary": offense_summary,
            "zones": offense
        },

        "defense": {
            "summary": defense_summary,
            "zones": defense
        }
    }