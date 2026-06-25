import httpx
import os
import logging
from sqlalchemy.orm import Session
from . import models, scoring

logger = logging.getLogger("uvicorn")

# football-data.org API configurations
API_BASE_URL = "https://api.football-data.org/v4"
# World Cup competition code is 'WC'
COMPETITION_CODE = "WC"

def get_api_headers():
    api_key = os.getenv("FOOTBALL_DATA_API_KEY", "")
    headers = {}
    if api_key:
        headers["X-Auth-Token"] = api_key
    return headers

async def fetch_standings_from_api() -> dict:
    """
    Fetch group standings from football-data.org and format them into:
    {"A": ["Team 1", "Team 2"], "B": ["Team 3", "Team 4"], ...}
    """
    headers = get_api_headers()
    if not headers:
        logger.warning("Sincronización API: No se encontró la variable FOOTBALL_DATA_API_KEY. Sincronización omitida.")
        return {}
        
    url = f"{API_BASE_URL}/competitions/{COMPETITION_CODE}/standings"
    logger.info(f"Sincronización API: Consultando standings en {url}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Sincronización API: Error al consultar standings ({response.status_code})")
            return {}
            
        data = response.json()
        standings = data.get("standings", [])
        
        formatted_standings = {}
        for s in standings:
            # We look for total total group stage standings
            group_str = s.get("group", "") or ""
            if s.get("type") == "TOTAL" and "GROUP" in group_str.upper():
                group_name = group_str.upper().replace("GROUP_", "").replace("GROUP", "").strip() # "A", "B", etc.
                table = s.get("table", [])
                
                # We need top 2 teams in the group
                team_1 = table[0]["team"]["name"] if len(table) > 0 else ""
                team_2 = table[1]["team"]["name"] if len(table) > 1 else ""
                
                formatted_standings[group_name] = [team_1, team_2]
                
        return formatted_standings

async def fetch_scorers_from_api() -> list:
    """
    Fetch top scorers from football-data.org and format them into:
    [{"name": "Kylian Mbappé", "team": "France", "goals": 6}, ...]
    """
    headers = get_api_headers()
    if not headers:
        return []
        
    url = f"{API_BASE_URL}/competitions/{COMPETITION_CODE}/scorers?limit=500"
    logger.info(f"Sincronización API: Consultando goleadores en {url}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Sincronización API: Error al consultar goleadores ({response.status_code})")
            return []
            
        data = response.json()
        scorers = data.get("scorers", [])
        
        formatted_scorers = []
        for s in scorers:
            player_name = s.get("player", {}).get("name", "")
            team_name = s.get("team", {}).get("name", "")
            goals = s.get("goals", 0)
            
            if player_name:
                formatted_scorers.append({
                    "name": player_name,
                    "team": team_name,
                    "goals": goals
                })
        return formatted_scorers


async def fetch_matches_from_api() -> list:
    """
    Fetch all matches from football-data.org and format them into:
    [{"id": 123, "utcDate": "2026-06-14T16:00:00Z", "status": "FINISHED",
      "stage": "GROUP_STAGE", "group": "A", "homeTeam": "Spain",
      "awayTeam": "Germany", "homeScore": 1, "awayScore": 2}, ...]
    """
    headers = get_api_headers()
    if not headers:
        return []

    url = f"{API_BASE_URL}/competitions/{COMPETITION_CODE}/matches"
    logger.info(f"Sincronización API: Consultando partidos en {url}...")

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Sincronización API: Error al consultar partidos ({response.status_code})")
            return []

        data = response.json()
        matches = data.get("matches", [])

        formatted = []
        for m in matches:
            score = m.get("score", {})
            ft = score.get("fullTime", {})
            formatted.append({
                "id": m.get("id"),
                "utcDate": m.get("utcDate", ""),
                "status": m.get("status", ""),
                "stage": m.get("stage", ""),
                "group": (m.get("group") or "").replace("GROUP_", ""),
                "homeTeam": m.get("homeTeam", {}).get("name", ""),
                "awayTeam": m.get("awayTeam", {}).get("name", ""),
                "homeScore": ft.get("home"),
                "awayScore": ft.get("away"),
            })

        return formatted


async def sync_all_data(db: Session) -> bool:
    """
    Sync standings, scorers, and top4 from API, recalculate scores, and save to DB.
    Returns True if sync fetched new data, False if skipped.
    """
    try:
        standings = await fetch_standings_from_api()
        scorers = await fetch_scorers_from_api()
        matches = await fetch_matches_from_api()
        
        # If API returned nothing or we didn't have API keys, skip saving but recalculate
        if not standings and not scorers and not matches:
            logger.info("Sincronización API: No se obtuvieron datos nuevos de la API. Manteniendo datos actuales.")
            return False
            
        # Update SQLite RealWorldData
        if standings:
            db_standings = db.query(models.RealWorldData).filter(models.RealWorldData.key == "standings").first()
            if db_standings:
                db_standings.value = standings
            else:
                db.add(models.RealWorldData(key="standings", value=standings))
                
        if scorers:
            db_scorers = db.query(models.RealWorldData).filter(models.RealWorldData.key == "scorers").first()
            if db_scorers:
                db_scorers.value = scorers
            else:
                db.add(models.RealWorldData(key="scorers", value=scorers))
                
        if matches:
            db_matches = db.query(models.RealWorldData).filter(models.RealWorldData.key == "matches").first()
            if db_matches:
                db_matches.value = matches
            else:
                db.add(models.RealWorldData(key="matches", value=matches))
                
        db.commit()
        logger.info("Sincronización API: Base de datos actualizada con datos reales de la API.")
        
        # Recalculate points
        scoring.calculate_scores(db)
        logger.info("Sincronización API: Puntos recalculados con éxito!")
        return True
        
    except Exception as e:
        logger.error(f"Sincronización API: Fallo general en la sincronización: {e}")
        return False
