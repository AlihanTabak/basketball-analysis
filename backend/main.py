from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from routers.shot_analysis import router as shot_analysis_router
from routers.team_shot_analysis import router as team_shot_analysis_router
from routers.team_matchup_analysis import router as team_matchup_analysis_router

from database import engine


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Basketball Analytics API"
)

app.include_router(shot_analysis_router)
app.include_router(team_shot_analysis_router)
app.include_router(team_matchup_analysis_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CONSTANTS
# =========================================================

SEASON_MAP = {
    174: "2026-2027",
    172: "2025-2026",
    170: "2024-2025",
    168: "2023-2024",
    166: "2022-2023"
}


# =========================================================
# HELPERS
# =========================================================

def nullable_float(value):
    if value is None:
        return None

    return float(value)


def nullable_int(value):
    if value is None:
        return None

    return int(value)


def build_player_name(row):
    name = " ".join(
        part
        for part in [
            row["first_name"],
            row["last_name"]
        ]
        if part
    )

    return (
        name
        or f"Player {row['player_id']}"
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Basketball Analytics API"
    }


# =========================================================
# SEASONS
# =========================================================

@app.get("/api/seasons")
def get_seasons():

    query = text("""
        SELECT DISTINCT
            season_id

        FROM analytics.teams

        ORDER BY season_id DESC
    """)

    with engine.connect() as connection:
        rows = (
            connection
            .execute(query)
            .mappings()
            .all()
        )

    return [
        {
            "season_id": row["season_id"],
            "season": SEASON_MAP.get(
                row["season_id"],
                str(row["season_id"])
            )
        }
        for row in rows
    ]


# =========================================================
# TEAMS
# =========================================================

@app.get("/api/teams")
def get_teams(
    season_id: int = 172
):

    query = text("""
        SELECT
            team_id,
            team_name,
            city,
            team_code,
            logo_url,
            color_1,
            color_2

        FROM analytics.teams

        WHERE season_id = :season_id

        ORDER BY team_name
    """)

    with engine.connect() as connection:

        rows = (
            connection
            .execute(
                query,
                {
                    "season_id": season_id
                }
            )
            .mappings()
            .all()
        )

    return [
        {
            "team_id": row["team_id"],
            "team_name": row["team_name"],
            "city": row["city"],
            "team_code": row["team_code"],
            "logo_url": row["logo_url"],
            "color_1": row["color_1"],
            "color_2": row["color_2"]
        }
        for row in rows
    ]


@app.get("/api/teams/{team_id}/analysis")
def get_team_analysis(
    team_id: int,
    season_id: int = 172
):
    query = text("""
        SELECT
            ts.*,

            tp.ppg_percentile,
            tp.ppg_rank,

            tp.two_pct_percentile,
            tp.two_pct_rank,

            tp.three_pct_percentile,
            tp.three_pct_rank,

            tp.ft_pct_percentile,
            tp.ft_pct_rank,

            tp.rebounds_percentile,
            tp.rebounds_rank,

            tp.assists_percentile,
            tp.assists_rank,

            tp.steals_percentile,
            tp.steals_rank,

            tp.turnovers_percentile,
            tp.turnovers_rank,

            tp.blocks_percentile,
            tp.blocks_rank,

            tp.efficiency_percentile,
            tp.efficiency_rank,

            tp.team_count,

            la.avg_ppg,
            la.avg_two_pct,
            la.avg_three_pct,
            la.avg_ft_pct,
            la.avg_rebounds_pg,
            la.avg_assists_pg,
            la.avg_steals_pg,
            la.avg_turnovers_pg,
            la.avg_blocks_pg,
            la.avg_efficiency_pg,

            t.team_name,
            t.city,
            t.team_code,
            t.logo_url,
            t.color_1,
            t.color_2

        FROM analytics.team_season_stats ts

        LEFT JOIN analytics.team_percentiles tp
            ON tp.team_id = ts.team_id
           AND tp.season_id = ts.season_id

        LEFT JOIN analytics.league_team_averages la
            ON la.season_id = ts.season_id

        LEFT JOIN analytics.teams t
            ON t.team_id = ts.team_id
           AND t.season_id = ts.season_id

        WHERE ts.team_id = :team_id
          AND ts.season_id = :season_id

        LIMIT 1
    """)

    player_query = text("""
        SELECT
            pa.player_id,

            p.first_name,
            p.last_name,

            pa.games,
            pa.average_minutes,
            pa.points_per_game,
            pa.total_rebounds_pg,
            pa.assists_pg,

            pa.ts_pct,
            pa.efg_pct,
            pa.usg_pct

        FROM analytics.player_advanced_stats pa

        LEFT JOIN analytics.players p
            ON p.player_id = pa.player_id

        WHERE pa.team_id = :team_id
          AND pa.season_id = :season_id

        ORDER BY
            pa.points_per_game DESC
    """)

    with engine.connect() as connection:

        team = (
            connection
            .execute(
                query,
                {
                    "team_id": team_id,
                    "season_id": season_id
                }
            )
            .mappings()
            .first()
        )

        if team is None:
            raise HTTPException(
                status_code=404,
                detail="Team not found"
            )

        players = (
            connection
            .execute(
                player_query,
                {
                    "team_id": team_id,
                    "season_id": season_id
                }
            )
            .mappings()
            .all()
        )

    roster = []

    for row in players:

        player_name = build_player_name(row)

        roster.append({
            "player_id": row["player_id"],
            "player_name": player_name,

            "games": nullable_int(
                row["games"]
            ),

            "average_minutes": nullable_float(
                row["average_minutes"]
            ),

            "ppg": nullable_float(
                row["points_per_game"]
            ),

            "rpg": nullable_float(
                row["total_rebounds_pg"]
            ),

            "apg": nullable_float(
                row["assists_pg"]
            ),

            "ts_pct": nullable_float(
                row["ts_pct"]
            ),

            "efg_pct": nullable_float(
                row["efg_pct"]
            ),

            "usg_pct": nullable_float(
                row["usg_pct"]
            )
        })

    return {
        "team_id": team["team_id"],

        "team_name": team["team_name"],
        "city": team["city"],
        "team_code": team["team_code"],
        "logo_url": team["logo_url"],

        "colors": {
            "primary": team["color_1"],
            "secondary": team["color_2"]
        },

        "season_id": team["season_id"],

        "season": SEASON_MAP.get(
            team["season_id"],
            str(team["season_id"])
        ),

        "record": {
            "games": nullable_int(
                team["games"]
            ),

            "wins": nullable_int(
                team["wins"]
            ),

            "losses": nullable_int(
                team["losses"]
            )
        },

        "stats": {
            "ppg": nullable_float(
                team["points_per_game"]
            ),

            "two_pct": nullable_float(
                team["two_pct"]
            ),

            "three_pct": nullable_float(
                team["three_pct"]
            ),

            "ft_pct": nullable_float(
                team["ft_pct"]
            ),

            "rebounds_pg": nullable_float(
                (
                    team["defensive_rebounds_pg"] or 0
                )
                +
                (
                    team["offensive_rebounds_pg"] or 0
                )
            ),

            "assists_pg": nullable_float(
                team["assists_pg"]
            ),

            "steals_pg": nullable_float(
                team["steals_pg"]
            ),

            "turnovers_pg": nullable_float(
                team["turnovers_pg"]
            ),

            "blocks_pg": nullable_float(
                team["blocks_pg"]
            ),

            "efficiency_pg": nullable_float(
                team["efficiency_pg"]
            )
        },

        "percentiles": {
            "team_count": nullable_int(
                team["team_count"]
            ),

            "ppg": nullable_float(
                team["ppg_percentile"]
            ),

            "ppg_rank": nullable_int(
                team["ppg_rank"]
            ),

            "two_pct": nullable_float(
                team["two_pct_percentile"]
            ),

            "two_pct_rank": nullable_int(
                team["two_pct_rank"]
            ),

            "three_pct": nullable_float(
                team["three_pct_percentile"]
            ),

            "three_pct_rank": nullable_int(
                team["three_pct_rank"]
            ),

            "ft_pct": nullable_float(
                team["ft_pct_percentile"]
            ),

            "ft_pct_rank": nullable_int(
                team["ft_pct_rank"]
            ),

            "rebounds": nullable_float(
                team["rebounds_percentile"]
            ),

            "rebounds_rank": nullable_int(
                team["rebounds_rank"]
            ),

            "assists": nullable_float(
                team["assists_percentile"]
            ),

            "assists_rank": nullable_int(
                team["assists_rank"]
            ),

            "steals": nullable_float(
                team["steals_percentile"]
            ),

            "steals_rank": nullable_int(
                team["steals_rank"]
            ),

            "turnovers": nullable_float(
                team["turnovers_percentile"]
            ),

            "turnovers_rank": nullable_int(
                team["turnovers_rank"]
            ),

            "blocks": nullable_float(
                team["blocks_percentile"]
            ),

            "blocks_rank": nullable_int(
                team["blocks_rank"]
            ),

            "efficiency": nullable_float(
                team["efficiency_percentile"]
            ),

            "efficiency_rank": nullable_int(
                team["efficiency_rank"]
            )
        },

        "league_averages": {
            "ppg": nullable_float(
                team["avg_ppg"]
            ),

            "two_pct": nullable_float(
                team["avg_two_pct"]
            ),

            "three_pct": nullable_float(
                team["avg_three_pct"]
            ),

            "ft_pct": nullable_float(
                team["avg_ft_pct"]
            ),

            "rebounds": nullable_float(
                team["avg_rebounds_pg"]
            ),

            "assists": nullable_float(
                team["avg_assists_pg"]
            ),

            "steals": nullable_float(
                team["avg_steals_pg"]
            ),

            "turnovers": nullable_float(
                team["avg_turnovers_pg"]
            ),

            "blocks": nullable_float(
                team["avg_blocks_pg"]
            ),

            "efficiency": nullable_float(
                team["avg_efficiency_pg"]
            )
        },

        "roster": roster
    }


# =========================================================
# ALL PLAYERS FOR A SEASON
#
# Compare ekranındaki dropdown için.
# =========================================================

@app.get("/api/players")
def get_players(
    season_id: int = 172
):

    query = text("""
        SELECT DISTINCT ON (
            pa.player_id,
            pa.team_id
        )
            pa.player_id,
            pa.team_id,

            p.first_name,
            p.last_name,
            p.image_url,

            t.team_name,

            pa.games,
            pa.average_minutes,
            pa.points_per_game

        FROM analytics.player_advanced_stats pa

        LEFT JOIN analytics.players p
            ON p.player_id = pa.player_id

        LEFT JOIN analytics.teams t
            ON t.team_id = pa.team_id
           AND t.season_id = pa.season_id

        WHERE pa.season_id = :season_id

        ORDER BY
            pa.player_id,
            pa.team_id,
            pa.games DESC
    """)

    with engine.connect() as connection:

        rows = (
            connection
            .execute(
                query,
                {
                    "season_id": season_id
                }
            )
            .mappings()
            .all()
        )

    players = []

    for row in rows:

        players.append({
            "player_id": row["player_id"],
            "player_name": build_player_name(row),

            "team_id": row["team_id"],
            "team_name": (
                row["team_name"]
                or f"Team {row['team_id']}"
            ),

            "image_url": row["image_url"],

            "games": nullable_int(
                row["games"]
            ),

            "average_minutes": nullable_float(
                row["average_minutes"]
            ),

            "points_per_game": nullable_float(
                row["points_per_game"]
            )
        })

    players.sort(
        key=lambda x: (
            x["player_name"].lower(),
            x["team_name"].lower()
        )
    )

    return players


# =========================================================
# TEAM PLAYERS
# =========================================================

@app.get("/api/teams/{team_id}/players")
def get_team_players(
    team_id: int,
    season_id: int = 172
):

    query = text("""
        SELECT DISTINCT
            pa.player_id,

            p.first_name,
            p.last_name,
            p.image_url,

            pa.games,
            pa.average_minutes,
            pa.points_per_game

        FROM analytics.player_archetypes pa

        LEFT JOIN analytics.players p
            ON p.player_id = pa.player_id

        WHERE pa.team_id = :team_id
          AND pa.season_id = :season_id

        ORDER BY
            pa.points_per_game DESC,
            p.last_name,
            p.first_name
    """)

    with engine.connect() as connection:

        rows = (
            connection
            .execute(
                query,
                {
                    "team_id": team_id,
                    "season_id": season_id
                }
            )
            .mappings()
            .all()
        )

    players = []

    for row in rows:

        players.append({
            "player_id": row["player_id"],

            "player_name": build_player_name(
                row
            ),

            "image_url": row["image_url"],

            "games": nullable_int(
                row["games"]
            ),

            "average_minutes": nullable_float(
                row["average_minutes"]
            ),

            "points_per_game": nullable_float(
                row["points_per_game"]
            )
        })

    return players


# =========================================================
# PLAYER COMPARISON
#
# Bunu analysis endpoint'inden önce tutmak okunabilirlik
# açısından daha iyi.
# =========================================================

@app.get("/api/players/compare")
def compare_players(
    player1: int,
    player2: int,
    season_id: int = 172
):

    if player1 == player2:

        raise HTTPException(
            status_code=400,
            detail="Two different players must be selected"
        )

    query = text("""
        WITH selected_players AS (

            SELECT
                pa.*,

                ROW_NUMBER() OVER (
                    PARTITION BY pa.player_id
                    ORDER BY
                        pa.games DESC,
                        pa.average_minutes DESC
                ) AS rn

            FROM analytics.player_advanced_stats pa

            WHERE pa.season_id = :season_id
              AND pa.player_id IN (
                  :player1,
                  :player2
              )
        )

        SELECT
            pa.player_id,
            pa.team_id,
            pa.season_id,

            p.first_name,
            p.last_name,
            p.image_url,

            t.team_name,

            pa.points_per_game,
            pa.total_rebounds_pg,
            pa.assists_pg,

            pa.efg_pct,
            pa.ts_pct,
            pa.usg_pct,
            pa.tov_pct,

            pa.ast_pct,
            pa.ast_to,

            pa.three_par,
            pa.ft_rate,

            pp.ts_percentile,
            pp.efg_percentile,
            pp.usg_percentile,
            pp.ast_percentile,
            pp.ast_to_percentile,
            pp.tov_percentile,
            pp.three_par_percentile,
            pp.ft_rate_percentile

        FROM selected_players pa

        LEFT JOIN analytics.players p
            ON p.player_id = pa.player_id

        LEFT JOIN analytics.teams t
            ON t.team_id = pa.team_id
           AND t.season_id = pa.season_id

        LEFT JOIN analytics.player_percentiles pp
            ON pp.player_id = pa.player_id
           AND pp.team_id = pa.team_id
           AND pp.season_id = pa.season_id

        WHERE pa.rn = 1
    """)

    with engine.connect() as connection:

        rows = (
            connection
            .execute(
                query,
                {
                    "season_id": season_id,
                    "player1": player1,
                    "player2": player2
                }
            )
            .mappings()
            .all()
        )

    if len(rows) != 2:

        raise HTTPException(
            status_code=404,
            detail="One or both players not found"
        )

    def serialize(row):

        return {
            "player_id": row["player_id"],

            "player_name": build_player_name(
                row
            ),

            "team_id": row["team_id"],

            "team_name": (
                row["team_name"]
                or f"Team {row['team_id']}"
            ),

            "stats": {

                "ppg": nullable_float(
                    row["points_per_game"]
                ),

                "rpg": nullable_float(
                    row["total_rebounds_pg"]
                ),

                "apg": nullable_float(
                    row["assists_pg"]
                ),

                "efg_pct": nullable_float(
                    row["efg_pct"]
                ),

                "ts_pct": nullable_float(
                    row["ts_pct"]
                ),

                "usg_pct": nullable_float(
                    row["usg_pct"]
                ),

                "tov_pct": nullable_float(
                    row["tov_pct"]
                ),

                "ast_pct": nullable_float(
                    row["ast_pct"]
                ),

                "ast_to": nullable_float(
                    row["ast_to"]
                ),

                "three_par": nullable_float(
                    row["three_par"]
                ),

                "ft_rate": nullable_float(
                    row["ft_rate"]
                )
            },

            "percentiles": {

                "ts": nullable_float(
                    row["ts_percentile"]
                ),

                "efg": nullable_float(
                    row["efg_percentile"]
                ),

                "usg": nullable_float(
                    row["usg_percentile"]
                ),

                "ast": nullable_float(
                    row["ast_percentile"]
                ),

                "ast_to": nullable_float(
                    row["ast_to_percentile"]
                ),

                "tov": nullable_float(
                    row["tov_percentile"]
                ),

                "three_par": nullable_float(
                    row["three_par_percentile"]
                ),

                "ft_rate": nullable_float(
                    row["ft_rate_percentile"]
                )
            }
        }

    data = {
        row["player_id"]: serialize(row)
        for row in rows
    }

    return {
        "season_id": season_id,
        "season": SEASON_MAP.get(
            season_id,
            str(season_id)
        ),

        "player1": data[player1],
        "player2": data[player2]
    }


# =========================================================
# PLAYER ANALYSIS
# =========================================================

@app.get("/api/players/{player_id}/analysis")
def get_player_analysis(
    player_id: int,
    season_id: int = 172
):

    query = text("""
        SELECT
            pa.*,

            pp.ts_percentile,
            pp.efg_percentile,
            pp.usg_percentile,
            pp.ast_percentile,
            pp.ast_to_percentile,
            pp.tov_percentile,
            pp.three_par_percentile,
            pp.ft_rate_percentile,

            pp.percentile_eligible,
            pp.eligible_player_count,

            pp.ts_rank,
            pp.efg_rank,
            pp.usg_rank,
            pp.ast_rank,
            pp.ast_to_rank,
            pp.tov_rank,
            pp.three_par_rank,
            pp.ft_rate_rank,

            la.avg_ts_pct,
            la.avg_efg_pct,
            la.avg_usg_pct,
            la.avg_tov_pct,
            la.avg_ast_pct,
            la.avg_ast_to,
            la.avg_three_par,
            la.avg_ft_rate,

            p.first_name,
            p.last_name,
            p.image_url,

            t.team_name,
            t.city,
            t.team_code,
            t.logo_url,
            t.color_1,
            t.color_2

        FROM analytics.player_archetypes pa

        LEFT JOIN analytics.player_percentiles pp
            ON pp.player_id = pa.player_id
           AND pp.team_id = pa.team_id
           AND pp.season_id = pa.season_id

        LEFT JOIN analytics.players p
            ON p.player_id = pa.player_id

        LEFT JOIN analytics.teams t
            ON t.team_id = pa.team_id
           AND t.season_id = pa.season_id

        LEFT JOIN analytics.league_player_averages la
            ON la.season_id = pa.season_id

        WHERE pa.player_id = :player_id
          AND pa.season_id = :season_id

        ORDER BY
            pa.games DESC,
            pa.average_minutes DESC

        LIMIT 1
    """)

    with engine.connect() as connection:

        row = (
            connection
            .execute(
                query,
                {
                    "player_id": player_id,
                    "season_id": season_id
                }
            )
            .mappings()
            .first()
        )

    if row is None:

        raise HTTPException(
            status_code=404,
            detail="Player not found"
        )


    # -----------------------------------------------------
    # ARCHETYPES
    # -----------------------------------------------------

    archetypes = []

    if row["is_primary_scorer"]:
        archetypes.append(
            "Primary Scorer"
        )

    if row["is_shot_creator"]:
        archetypes.append(
            "Shot Creator"
        )

    if row["is_playmaker"]:
        archetypes.append(
            "Playmaker"
        )

    if row["is_efficient_role_player"]:
        archetypes.append(
            "Efficient Role Player"
        )

    if row["is_shooter"]:
        archetypes.append(
            "Shooter"
        )

    if row["is_interior_player"]:
        archetypes.append(
            "Interior Player"
        )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "player_id": row["player_id"],

        "player_name": build_player_name(
            row
        ),

        "player_image_url": row["image_url"],


        # TEAM

        "team_id": row["team_id"],

        "team_name": (
            row["team_name"]
            or f"Team {row['team_id']}"
        ),

        "team_city": row["city"],
        "team_code": row["team_code"],
        "team_logo_url": row["logo_url"],

        "team_colors": {
            "primary": row["color_1"],
            "secondary": row["color_2"]
        },


        # SEASON

        "season_id": row["season_id"],

        "season": SEASON_MAP.get(
            row["season_id"],
            str(row["season_id"])
        ),


        # SAMPLE

        "games": nullable_int(
            row["games"]
        ),

        "average_minutes": nullable_float(
            row["average_minutes"]
        ),


        # BASIC / ADVANCED STATS

        "stats": {

            "ppg": nullable_float(
                row["points_per_game"]
            ),

            "rpg": nullable_float(
                row["total_rebounds_pg"]
            ),

            "apg": nullable_float(
                row["assists_pg"]
            ),

            "efg_pct": nullable_float(
                row["efg_pct"]
            ),

            "ts_pct": nullable_float(
                row["ts_pct"]
            ),

            "usg_pct": nullable_float(
                row["usg_pct"]
            ),

            "tov_pct": nullable_float(
                row["tov_pct"]
            ),

            "ast_pct": nullable_float(
                row["ast_pct"]
            ),

            "ast_to": nullable_float(
                row["ast_to"]
            ),

            "three_par": nullable_float(
                row["three_par"]
            ),

            "ft_rate": nullable_float(
                row["ft_rate"]
            )
        },


        # LEAGUE AVERAGES

        "league_averages": {

            "ts": nullable_float(
                row["avg_ts_pct"]
            ),

            "efg": nullable_float(
                row["avg_efg_pct"]
            ),

            "usg": nullable_float(
                row["avg_usg_pct"]
            ),

            "tov": nullable_float(
                row["avg_tov_pct"]
            ),

            "ast": nullable_float(
                row["avg_ast_pct"]
            ),

            "ast_to": nullable_float(
                row["avg_ast_to"]
            ),

            "three_par": nullable_float(
                row["avg_three_par"]
            ),

            "ft_rate": nullable_float(
                row["avg_ft_rate"]
            )
        },


        # PERCENTILES

        "percentiles": {

            "eligible": bool(
                row["percentile_eligible"]
            ),

            "player_count": nullable_int(
                row["eligible_player_count"]
            ),


            "ts": nullable_float(
                row["ts_percentile"]
            ),

            "ts_rank": nullable_int(
                row["ts_rank"]
            ),


            "efg": nullable_float(
                row["efg_percentile"]
            ),

            "efg_rank": nullable_int(
                row["efg_rank"]
            ),


            "usg": nullable_float(
                row["usg_percentile"]
            ),

            "usg_rank": nullable_int(
                row["usg_rank"]
            ),


            "ast": nullable_float(
                row["ast_percentile"]
            ),

            "ast_rank": nullable_int(
                row["ast_rank"]
            ),


            "ast_to": nullable_float(
                row["ast_to_percentile"]
            ),

            "ast_to_rank": nullable_int(
                row["ast_to_rank"]
            ),


            "tov": nullable_float(
                row["tov_percentile"]
            ),

            "tov_rank": nullable_int(
                row["tov_rank"]
            ),


            "three_par": nullable_float(
                row["three_par_percentile"]
            ),

            "three_par_rank": nullable_int(
                row["three_par_rank"]
            ),


            "ft_rate": nullable_float(
                row["ft_rate_percentile"]
            ),

            "ft_rate_rank": nullable_int(
                row["ft_rate_rank"]
            )
        },


        "archetypes": archetypes
    }