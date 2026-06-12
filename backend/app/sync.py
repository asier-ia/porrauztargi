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
            if s.get("type") == "TOTAL" and "GROUP_" in s.get("group", ""):
                group_name = s["group"].replace("GROUP_", "").strip() # "A", "B", etc.
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
        
    url = f"{API_BASE_URL}/competitions/{COMPETITION_CODE}/scorers"
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

async def sync_all_data(db: Session) -> bool:
    """
    Sync standings, scorers, and top4 from API, recalculate scores, and save to DB.
    Returns True if sync fetched new data, False if skipped.
    """
    try:
        standings = await fetch_standings_from_api()
        scorers = await fetch_scorers_from_api()
        
        # If API returned nothing or we didn't have API keys, skip saving but recalculate
        if not standings and not scorers:
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
                
        db.commit()
        logger.info("Sincronización API: Base de datos actualizada con datos reales de la API.")
        
        # Recalculate points
        scoring.calculate_scores(db)
        logger.info("Sincronización API: Puntos recalculados con éxito!")
        return True
        
    except Exception as e:
        logger.error(f"Sincronización API: Fallo general en la sincronización: {e}")
        return False
