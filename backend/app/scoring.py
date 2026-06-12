import unicodedata
from sqlalchemy.orm import Session
from . import models

# Translation map from Spanish (Excel) to English (football-data.org API standard)
TEAM_TRANSLATIONS = {
    'Alemania': 'Germany',
    'Arabia Saudi': 'Saudi Arabia',
    'Argelia': 'Algeria',
    'Argentina': 'Argentina',
    'Australia': 'Australia',
    'Austria': 'Austria',
    'Belgica': 'Belgium',
    'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
    'Brasil': 'Brazil',
    'Cabo Verde': 'Cape Verde',
    'Canada': 'Canada',
    'Catar': 'Qatar',
    'Chequia': 'Czechia',
    'Colombia': 'Colombia',
    'Costa de Marfil': 'Ivory Coast',
    'Croacia': 'Croatia',
    'Curazao': 'Curaçao',
    'EEUU': 'USA',
    'Ecuador': 'Ecuador',
    'Egipto': 'Egypt',
    'Escocia': 'Scotland',
    'España': 'Spain',
    'Francia': 'France',
    'Ghana': 'Ghana',
    'Haiti': 'Haiti',
    'Inglaterra': 'England',
    'Irak': 'Iraq',
    'Iran': 'Iran',
    'Japon': 'Japan',
    'Jordania': 'Jordan',
    'Marruecos': 'Morocco',
    'Mexico': 'Mexico',
    'Noruega': 'Norway',
    'Nueva Zelanda': 'New Zealand',
    'Paises Bajos': 'Netherlands',
    'Panama': 'Panama',
    'Paraguay': 'Paraguay',
    'Portugal': 'Portugal',
    'RD Congo': 'DR Congo',
    'Republica de Corea': 'South Korea',
    'Senegal': 'Senegal',
    'Sudafrica': 'South Africa',
    'Suecia': 'Sweden',
    'Suiza': 'Switzerland',
    'Tunez': 'Tunisia',
    'Turquia': 'Turkey',
    'Uruguay': 'Uruguay',
    'Uzbekistan': 'Uzbekistan'
}

def normalize_string(s: str) -> str:
    """
    Remove accents, convert to lowercase, and strip spaces for robust matching.
    """
    if not s:
        return ""
    # Remove accents
    nfkd_form = unicodedata.normalize('NFKD', s)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Standardize common abbreviations or variations
    normalized = only_ascii.lower().strip()
    # Replace common football API naming variations
    normalized = normalized.replace("united states of america", "usa")
    normalized = normalized.replace("united states", "usa")
    normalized = normalized.replace("republic of korea", "south korea")
    normalized = normalized.replace("korea republic", "south korea")
    normalized = normalized.replace("czech republic", "czechia")
    return normalized

def match_teams(predicted_name: str, real_name: str) -> bool:
    """
    Compare team names using our translations and normalization.
    """
    p_norm = normalize_string(predicted_name)
    r_norm = normalize_string(real_name)
    
    if p_norm == r_norm:
        return True
        
    # Apply translation and compare
    translated = TEAM_TRANSLATIONS.get(predicted_name)
    if translated:
        if normalize_string(translated) == r_norm:
            return True
            
    # Reverse lookup translation mapping just in case
    for es_name, en_name in TEAM_TRANSLATIONS.items():
        if normalize_string(es_name) == p_norm and normalize_string(en_name) == r_norm:
            return True
            
    return False

def match_scorer(predicted_name: str, real_name: str) -> bool:
    """
    Robust matching for scorers. Matches if:
    - Normalized strings are identical
    - One is a substring of the other (e.g., 'Mbappe' in 'Kylian Mbappe')
    - Handles initials (e.g., 'B. Díaz' matches 'Brahim Díaz')
    """
    def normalize_player(s: str) -> str:
        norm = normalize_string(s)
        norm = norm.replace(".", "")
        norm = norm.replace(" jr", " junior")
        norm = norm.replace("-", " ")
        return norm.strip()

    p_norm = normalize_player(predicted_name)
    r_norm = normalize_player(real_name)
    
    if not p_norm or not r_norm:
        return False
        
    if p_norm == r_norm:
        return True
        
    # Check substring match (useful for first name + last name variations)
    if p_norm in r_norm or r_norm in p_norm:
        return True
        
    # Check for initials matching (e.g. "B. Díaz" with "Brahim Díaz")
    p_words = p_norm.split()
    r_words = r_norm.split()
    
    if len(p_words) >= 2 and len(p_words[0]) == 1:
        # First word of predicted is an initial (e.g., "b")
        if r_words[0].startswith(p_words[0]):
            # Check if all other predicted words (e.g., "diaz") are in real words
            remaining_p = p_words[1:]
            if all(word in r_words for word in remaining_p):
                return True
                
    if len(r_words) >= 2 and len(r_words[0]) == 1:
        # First word of real is an initial (e.g., "b")
        if p_words[0].startswith(r_words[0]):
            # Check if all other real words are in predicted words
            remaining_r = r_words[1:]
            if all(word in p_words for word in remaining_r):
                return True
                
    return False

def calculate_scores(db: Session):
    """
    Core score recalculation logic based on the official rules:
    - Groups (A-L): 2 points for exact 1st, 1 point for exact 2nd.
    - Scorers: 2 points per goal scored (excluding penalty shootout after extra time).
    - Top 4: Champion (14 pts), Runner-up (8 pts), 3rd (6 pts), 4th (4 pts).
    """
    # Fetch real world data
    standings_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "standings").first()
    scorers_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "scorers").first()
    top4_data = db.query(models.RealWorldData).filter(models.RealWorldData.key == "top4").first()
    
    real_standings = standings_data.value if standings_data else {}
    real_scorers = scorers_data.value if scorers_data else []
    real_top4 = top4_data.value if top4_data else {}
    
    participants = db.query(models.Participant).all()
    
    for p in participants:
        pred = p.prediction
        if not pred:
            continue
            
        points_groups = 0
        points_scorers = 0
        points_top4 = 0
        
        # 1. Calculate Group Standings (A-L)
        # Pred format: {"A": ["Mexico", "South Korea"], ...}
        # Real format: {"A": ["Mexico", "South Korea"], ...}
        for grp, pred_teams in pred.group_predictions.items():
            real_teams = real_standings.get(grp)
            if not real_teams or len(real_teams) < 2:
                continue
                
            # Exact 1st place = 2 pts
            if pred_teams[0] and real_teams[0] and match_teams(pred_teams[0], real_teams[0]):
                points_groups += 2
                
            # Exact 2nd place = 1 pt
            if pred_teams[1] and real_teams[1] and match_teams(pred_teams[1], real_teams[1]):
                points_groups += 1
                
        # 2. Calculate Scorers Points
        # 2 points per goal scored by selected players
        # Pred format: ["Mbappe", "Messi", ...]
        # Real format: [{"name": "Mbappe", "goals": 6}, ...]
        for p_scorer in pred.scorers_predictions:
            # Find matching scorer in real scorers list
            for r_scorer in real_scorers:
                if match_scorer(p_scorer, r_scorer["name"]):
                    points_scorers += r_scorer["goals"] * 2
                    break
                    
        # 3. Calculate Top 4 Points
        # Champion: 14 pts, Runner-up: 8 pts, 3rd: 6 pts, 4th: 4 pts
        # Pred format: {"1": "France", "2": "Spain", ...}
        # Real format: {"1": "France", "2": "Spain", ...}
        for pos, pred_team in pred.top4_predictions.items():
            real_team = real_top4.get(pos)
            if not real_team or not pred_team:
                continue
                
            if match_teams(pred_team, real_team):
                if pos == "1":
                    points_top4 += 14
                elif pos == "2":
                    points_top4 += 8
                elif pos == "3":
                    points_top4 += 6
                elif pos == "4":
                    points_top4 += 4
                    
        # Update participant totals
        p.points_groups = points_groups
        p.points_scorers = points_scorers
        p.points_top4 = points_top4
        p.points_total = points_groups + points_scorers + points_top4

    # 4. Save and assign Rankings with Standard Competition Rank for ties (e.g., 1, 1, 3)
    # Sort alphabetically first so secondary sort is alphabetical
    participants.sort(key=lambda x: x.name)
    participants.sort(key=lambda x: x.points_total, reverse=True)
    
    current_rank = 1
    for i, p in enumerate(participants):
        if i > 0 and p.points_total < participants[i - 1].points_total:
            current_rank = i + 1
        p.rank = current_rank
        
    db.commit()
