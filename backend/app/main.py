from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import asyncio
from datetime import datetime, timedelta, timezone

from .database import get_db, engine, Base
from . import models, schemas, scoring, sync
from .stripe_service import router as stripe_router

# We make sure tables are initialized on startup (even though we seeded)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Porra Mundial 2026 - Bar Uztargi API", version="1.0.0")

app.include_router(stripe_router)

# Setup CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we can allow all, can be restricted later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global tracker for next API update
next_update_at = datetime.now(timezone.utc) + timedelta(hours=4)

async def auto_update_task():
    """
    Loop running in the background every 4 hours to sync with the API
    and recalculate points.
    """
    global next_update_at
    while True:
        # Calculate delay dynamically
        now = datetime.now(timezone.utc)
        delay = (next_update_at - now).total_seconds()
        if delay > 0:
            await asyncio.sleep(delay)
            
        print("Sincronización Automática: Iniciando cron de 4h...")
        db = next(get_db())
        try:
            await sync.sync_all_data(db)
        except Exception as e:
            print(f"Sincronización Automática: Error en cron: {e}")
        finally:
            db.close()
            
        # Update next timestamp (4 hours from now)
        next_update_at = datetime.now(timezone.utc) + timedelta(hours=4)

@app.on_event("startup")
async def on_startup():
    # Run initial sync immediately
    db = next(get_db())
    try:
        await sync.sync_all_data(db)
    finally:
        db.close()
    # Spin up background loop
    asyncio.create_task(auto_update_task())

@app.get("/")
def read_root():
    return {"message": "Welcome to Porra Mundial 2026 Bar Uztargi API"}

@app.get("/api/next-update")
def get_next_update():
    """
    Return remaining seconds and timestamp for the next automatic sync.
    """
    now = datetime.now(timezone.utc)
    remaining = (next_update_at - now).total_seconds()
    return {
        "next_update_at": next_update_at.isoformat(),
        "countdown_seconds": max(0, int(remaining))
    }

@app.post("/api/admin/update-results")
def admin_update_results(payload: dict, db: Session = Depends(get_db)):
    """
    Directly update standings, scorers, and top 4 from an admin client (useful for offline testing)
    and trigger recalculation.
    Payload format:
    {
        "standings": {"A": ["Spain", "Germany"], ...},
        "scorers": [{"name": "Mbappé", "team": "France", "goals": 6}, ...],
        "top4": {"1": "Spain", "2": "Argentina", "3": "France", "4": "England"}
    }
    """
    standings = payload.get("standings")
    scorers = payload.get("scorers")
    top4 = payload.get("top4")
    
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
            
    if top4:
        db_top4 = db.query(models.RealWorldData).filter(models.RealWorldData.key == "top4").first()
        if db_top4:
            db_top4.value = top4
        else:
            db.add(models.RealWorldData(key="top4", value=top4))
            
    db.commit()
    
    # Recalculate everything
    scoring.calculate_scores(db)
    
    return {"message": "Results updated and rankings recalculated successfully!"}

def assign_prizes(participants: List[models.Participant]) -> List[schemas.ParticipantResponse]:
    """
    Calculate and attach the prize dynamically to each participant.
    Prizes: 1st (1668.0), 2nd (834.0), 3rd (278.0)
    """
    # Sort participants by points descending to be 100% sure of the order
    sorted_p = sorted(participants, key=lambda x: (x.points_total, x.name if x.name else ""), reverse=True)
    
    prizes_pool = [1668.0, 834.0, 278.0]
    
    # Group by points_total to find ties
    groups = []
    current_group = []
    for p in sorted_p:
        if not current_group or p.points_total == current_group[0].points_total:
            current_group.append(p)
        else:
            groups.append(current_group)
            current_group = [p]
    if current_group:
        groups.append(current_group)
        
    prizes_dict = {} # participant_id -> float
    current_index = 0
    for g in groups:
        n = len(g)
        # Sum corresponding prizes from pool for positions current_index to current_index + n - 1
        total_group_prize = 0.0
        for i in range(current_index, current_index + n):
            if i < len(prizes_pool):
                total_group_prize += prizes_pool[i]
                
        shared_prize = total_group_prize / n if n > 0 else 0.0
        for p in g:
            prizes_dict[p.id] = shared_prize
            
        current_index += n
        
    response_list = []
    for p in participants:
        res = schemas.ParticipantResponse.model_validate(p)
        res.prize = prizes_dict.get(p.id, 0.0)
        response_list.append(res)
        
    # Maintain standard sorting order (by rank ascending)
    response_list.sort(key=lambda x: x.rank if x.rank is not None else 999)
    return response_list

@app.get("/api/ranking", response_model=List[schemas.ParticipantResponse])
def get_ranking(limit: int = Query(default=10, ge=1, le=200), db: Session = Depends(get_db)):
    """
    Get participants ranking sorted by points with dynamically computed prizes.
    """
    all_participants = db.query(models.Participant).order_by(models.Participant.points_total.desc()).all()
    ranked_responses = assign_prizes(all_participants)
    return ranked_responses[:limit]

@app.get("/api/participants", response_model=List[schemas.ParticipantResponse])
def get_participants(db: Session = Depends(get_db)):
    """
    Get all participants (ordered alphabetically by name) for dropdown selection.
    """
    participants = db.query(models.Participant).order_by(models.Participant.name.asc()).all()
    
    # We also attach prizes for all of them so dropdown displays prizes if they are currently winning
    ranked_responses = assign_prizes(participants)
    return ranked_responses

@app.get("/api/participants/{participant_id}", response_model=schemas.ParticipantDetailResponse)
def get_participant_detail(participant_id: int, db: Session = Depends(get_db)):
    """
    Get detailed prediction and point breakdown for a single participant, with their current prize.
    """
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
        
    # Calculate prizes for everyone to find this participant's share
    all_participants = db.query(models.Participant).order_by(models.Participant.points_total.desc()).all()
    ranked_responses = assign_prizes(all_participants)
    
    # Find matching response
    matched_resp = next((r for r in ranked_responses if r.id == participant_id), None)
    
    # Convert to detail response
    detail_res = schemas.ParticipantDetailResponse.model_validate(participant)
    if matched_resp:
        detail_res.prize = matched_resp.prize
    
    # Calculate scorer matches using backend fuzzy matching
    real_scorers_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "scorers").first()
    real_scorers = real_scorers_data.value if real_scorers_data else []
    
    scorer_matches = []
    if participant.prediction:
        for p_scorer in participant.prediction.scorers_predictions:
            match = None
            for r_scorer in real_scorers:
                if scoring.match_scorer(p_scorer, r_scorer["name"]):
                    match = r_scorer
                    break
            scorer_matches.append(schemas.ScorerMatch(
                predicted_name=p_scorer,
                real_name=match["name"] if match else None,
                goals=match["goals"] if match else 0,
                points=match["goals"] * 2 if match else 0
            ))
    detail_res.scorer_matches = scorer_matches

    # Calculate group matches using backend robust matching
    real_standings_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "standings").first()
    real_standings = real_standings_data.value if real_standings_data else {}
    
    group_matches = {}
    if participant.prediction:
        for group, pred_teams in participant.prediction.group_predictions.items():
            real_teams = real_standings.get(group) or []
            matches_for_group = []
            for idx, pred_team in enumerate(pred_teams):
                is_correct = False
                real_name_at_pos = real_teams[idx] if idx < len(real_teams) else None
                
                if pred_team:
                    # Check exact position match
                    if real_name_at_pos and scoring.match_teams(pred_team, real_name_at_pos):
                        is_correct = True
                        
                matches_for_group.append(schemas.GroupMatchDetail(
                    predicted_name=pred_team,
                    real_name=real_name_at_pos,
                    is_correct=is_correct
                ))
            group_matches[group] = matches_for_group
    detail_res.group_matches = group_matches

    # Calculate top4 matches using backend robust matching
    real_top4_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "top4").first()
    real_top4 = real_top4_data.value if real_top4_data else {}
    
    top4_matches = []
    if participant.prediction:
        for pos, pred_team in participant.prediction.top4_predictions.items():
            real_team_at_pos = real_top4.get(pos)
            is_correct = False
            in_real_top4 = False
            
            if pred_team:
                if real_team_at_pos and scoring.match_teams(pred_team, real_team_at_pos):
                    is_correct = True
                elif any(real_t and scoring.match_teams(pred_team, real_t) for real_t in real_top4.values()):
                    in_real_top4 = True
                    
            points = 0
            if is_correct:
                points = 14 if pos == "1" else 8 if pos == "2" else 6 if pos == "3" else 4
            elif in_real_top4:
                points = 2
                
            top4_matches.append(schemas.Top4MatchDetail(
                position=pos,
                predicted_name=pred_team,
                real_name=real_team_at_pos,
                is_correct=is_correct,
                points=points
            ))
    detail_res.top4_matches = top4_matches
        
    return detail_res

@app.get("/api/scorers")
def get_scorers(db: Session = Depends(get_db)):
    """
    Get real-world top scorers data.
    """
    scorers_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "scorers").first()
    if not scorers_data:
        raise HTTPException(status_code=404, detail="Scorers data not found")
    return scorers_data.value

@app.get("/api/matches")
def get_matches(date: Optional[str] = Query(None), db: Session = Depends(get_db)):
    matches_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "matches").first()
    if not matches_data:
        return []

    matches = matches_data.value
    if date:
        matches = [m for m in matches if m.get("utcDate", "").startswith(date)]

    return sorted(matches, key=lambda m: m.get("utcDate", ""))


@app.get("/api/results")
def get_results(db: Session = Depends(get_db)):
    """
    Get real-world tournament results (group standings, top 4 final, and scorers).
    """
    standings = db.query(models.RealWorldData).filter(models.RealWorldData.key == "standings").first()
    top4 = db.query(models.RealWorldData).filter(models.RealWorldData.key == "top4").first()
    scorers = db.query(models.RealWorldData).filter(models.RealWorldData.key == "scorers").first()
    
    return {
        "standings": standings.value if standings else {},
        "top4": top4.value if top4 else {},
        "scorers": scorers.value if scorers else []
    }
