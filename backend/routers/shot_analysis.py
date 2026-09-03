from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from constants import SEASON_MAP

from database import engine


router = APIRouter(
    prefix="/api/players",
    tags=["Shot Analysis"]
)


@router.get("/{player_id}/shot-analysis")
def get_player_shot_analysis(
    player_id: int,
    season_id: int = 172
):

    season = SEASON_MAP.get(season_id)

    if season is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported season_id: {season_id}"
        )

    query = text("""
        SELECT
            player_id,
            player_name,
            season,

            shot_type,
            shot_zone,

            fga,
            fgm,
            fg_pct,

            points,
            points_per_shot,

            league_fg_pct,
            league_points_per_shot,

            fg_pct_diff,
            points_per_shot_diff,

            shot_frequency_pct,
            league_shot_frequency_pct,
            frequency_diff,

            alpha,
            beta,
            prior_strength,
            prior_fg_pct,

            eb_skill_fg_pct,
            eb_skill_diff,
            evidence_weight_pct,

            sample_confidence,
            total_fga,

            performance_percentile,
            frequency_percentile,

            performance_percentile_eligible,
            frequency_percentile_eligible,

            performance_level,
            volume_level,
            zone_profile

        FROM analytics.player_shot_profile_final

        WHERE player_id = :player_id
          AND season = :season

        ORDER BY fga DESC
    """)

    with engine.connect() as connection:
        rows = (
            connection
            .execute(
                query,
                {
                    "player_id": player_id,
                    "season": season
                }
            )
            .mappings()
            .all()
        )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Shot analysis data not found"
        )

    player_name = rows[0]["player_name"]
    total_fga = rows[0]["total_fga"]

    zones = []

    for row in rows:
        zones.append({
            "shot_zone": row["shot_zone"],
            "shot_type": row["shot_type"],

            "shooting": {
                "fga": row["fga"],
                "fgm": row["fgm"],
                "fg_pct": row["fg_pct"],
                "league_fg_pct": row["league_fg_pct"],
                "fg_pct_diff": row["fg_pct_diff"],
                "performance_percentile": row["performance_percentile"],
                "performance_level": row["performance_level"]
            },

            "scoring": {
                "points": row["points"],
                "points_per_shot": row["points_per_shot"],
                "league_points_per_shot": row["league_points_per_shot"],
                "points_per_shot_diff": row["points_per_shot_diff"]
            },

            "usage": {
                "shot_frequency_pct": row["shot_frequency_pct"],
                "league_shot_frequency_pct": row["league_shot_frequency_pct"],
                "frequency_diff": row["frequency_diff"],
                "frequency_percentile": row["frequency_percentile"],
                "volume_level": row["volume_level"]
            },

            "bayesian": {
                "prior_fg_pct": row["prior_fg_pct"],
                "prior_strength": row["prior_strength"],
                "alpha": row["alpha"],
                "beta": row["beta"],
                "eb_skill_fg_pct": row["eb_skill_fg_pct"],
                "eb_skill_diff": row["eb_skill_diff"],
                "evidence_weight_pct": row["evidence_weight_pct"]
            },

            "reliability": {
                "sample_level": row["sample_confidence"],
                "performance_percentile_eligible":
                    row["performance_percentile_eligible"],
                "frequency_percentile_eligible":
                    row["frequency_percentile_eligible"]
            },

            "profile": {
                "zone_profile": row["zone_profile"]
            }
        })

    return {
        "player": {
            "player_id": player_id,
            "player_name": player_name
        },
         "season_id": season_id,
        "season": season,

        "summary": {
            "total_fga": total_fga,

            "primary_strengths": [
                r["shot_zone"]
                for r in rows
                if r["zone_profile"] == "PRIMARY_STRENGTH"
            ],

            "strengths": [
                r["shot_zone"]
                for r in rows
                if r["zone_profile"] in (
                    "STRENGTH",
                    "POSITIVE",
                    "UNDERUSED_STRENGTH"
                )
            ],

            "tentative_strengths": [
                r["shot_zone"]
                for r in rows
                if r["zone_profile"] in (
                    "TENTATIVE_STRENGTH",
                    "TENTATIVE_POSITIVE"
                )
            ],

            "weaknesses": [
                r["shot_zone"]
                for r in rows
                if r["zone_profile"] in (
                    "WEAKNESS",
                    "OVERUSED",
                    "AVOID"
                )
            ],

            "limited_sample": [
                r["shot_zone"]
                for r in rows
                if r["zone_profile"] in (
                    "LIMITED_SAMPLE",
                    "INSUFFICIENT_SAMPLE"
                )
            ]
        },

        "zones": zones
    }