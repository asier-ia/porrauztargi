#!/usr/bin/env python3
"""Generates realistic demo data for the Porra Uztargi static site."""
import json
import os
import unicodedata
import random
import math
from copy import deepcopy

random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'data')
JSON_PATH = os.path.join(os.path.dirname(__file__), '..', 'datos_porra.json')

TEAM_TRANSLATIONS = {
    'Alemania': 'Germany', 'Arabia Saudi': 'Saudi Arabia', 'Argelia': 'Algeria',
    'Argentina': 'Argentina', 'Australia': 'Australia', 'Austria': 'Austria',
    'Belgica': 'Belgium', 'Bosnia y Herzegovina': 'Bosnia and Herzegovina',
    'Brasil': 'Brazil', 'Cabo Verde': 'Cape Verde', 'Canada': 'Canada',
    'Catar': 'Qatar', 'Chequia': 'Czechia', 'Colombia': 'Colombia',
    'Costa de Marfil': 'Ivory Coast', 'Croacia': 'Croatia', 'Curazao': 'Curaçao',
    'EEUU': 'USA', 'Ecuador': 'Ecuador', 'Egipto': 'Egypt', 'Escocia': 'Scotland',
    'Espana': 'Spain', 'Francia': 'France', 'Ghana': 'Ghana', 'Haiti': 'Haiti',
    'Inglaterra': 'England', 'Irak': 'Iraq', 'Iran': 'Iran', 'Japon': 'Japan',
    'Jordania': 'Jordan', 'Marruecos': 'Morocco', 'Mexico': 'Mexico',
    'Noruega': 'Norway', 'Nueva Zelanda': 'New Zealand', 'Paises Bajos': 'Netherlands',
    'Panama': 'Panama', 'Paraguay': 'Paraguay', 'Portugal': 'Portugal',
    'RD Congo': 'DR Congo', 'Republica de Corea': 'South Korea', 'Senegal': 'Senegal',
    'Sudafrica': 'South Africa', 'Suecia': 'Sweden', 'Suiza': 'Switzerland',
    'Tunez': 'Tunisia', 'Turquia': 'Turkey', 'Uruguay': 'Uruguay', 'Uzbekistan': 'Uzbekistan'
}

# Additional teams for filling groups
EXTRA_TEAMS = [
    'Eslovenia', 'Serbia', 'Polonia', 'Dinamarca', 'Gales', 'Costa Rica',
    'Nigeria', 'Camerun', 'Mali', 'Angola', 'Zambia', 'Venezuela',
    'Peru', 'Chile', 'Bolivia', 'Honduras', 'Jamaica', 'Guinea',
    'Burkina Faso', 'Togo', 'Benin', 'Eslovaquia', 'Hungria', 'Rumania'
]

def normalize_string(s):
    if not s:
        return ""
    nfkd = unicodedata.normalize('NFKD', s)
    only_ascii = "".join(c for c in nfkd if not unicodedata.combining(c))
    normalized = only_ascii.lower().strip()
    normalized = normalized.replace("united states of america", "usa")
    normalized = normalized.replace("united states", "usa")
    normalized = normalized.replace("republic of korea", "south korea")
    normalized = normalized.replace("korea republic", "south korea")
    normalized = normalized.replace("czech republic", "czechia")
    return normalized

def match_teams(predicted_name, real_name):
    p_norm = normalize_string(predicted_name)
    r_norm = normalize_string(real_name)
    if p_norm == r_norm:
        return True
    translated = TEAM_TRANSLATIONS.get(predicted_name)
    if translated and normalize_string(translated) == r_norm:
        return True
    for es_name, en_name in TEAM_TRANSLATIONS.items():
        if normalize_string(es_name) == p_norm and normalize_string(en_name) == r_norm:
            return True
    return False

REAL_GROUP_WINNERS = {
    'A': ['Mexico', 'Republica de Corea'],
    'B': ['Suiza', 'Eslovenia'],
    'C': ['Brasil', 'Marruecos'],
    'D': ['Paraguay', 'EEUU'],
    'E': ['Alemania', 'Ecuador'],
    'F': ['Paises Bajos', 'Japon'],
    'G': ['Belgica', 'Senegal'],
    'H': ['Espana', 'Uruguay'],
    'I': ['Francia', 'Noruega'],
    'J': ['Argentina', 'Argelia'],
    'K': ['Portugal', 'Colombia'],
    'L': ['Inglaterra', 'Croacia'],
}

REAL_TOP4 = {'1': 'Espana', '2': 'Francia', '3': 'Argentina', '4': 'Brasil'}

REAL_SCORERS = [
    {'name': 'Kylian Mbappe', 'team': 'Francia', 'goals': 8},
    {'name': 'Harry Kane', 'team': 'Inglaterra', 'goals': 6},
    {'name': 'Erling Haaland', 'team': 'Noruega', 'goals': 5},
    {'name': 'Lionel Messi', 'team': 'Argentina', 'goals': 4},
    {'name': 'Cristiano Ronaldo', 'team': 'Portugal', 'goals': 4},
    {'name': 'Vinicius Junior', 'team': 'Brasil', 'goals': 4},
    {'name': 'Lamine Yamal', 'team': 'Espana', 'goals': 3},
    {'name': 'Pedri', 'team': 'Espana', 'goals': 3},
    {'name': 'Antoine Griezmann', 'team': 'Francia', 'goals': 3},
    {'name': 'Jude Bellingham', 'team': 'Inglaterra', 'goals': 3},
    {'name': 'Lautaro Martinez', 'team': 'Argentina', 'goals': 3},
    {'name': 'Alvaro Morata', 'team': 'Espana', 'goals': 2},
    {'name': 'Olivier Giroud', 'team': 'Francia', 'goals': 2},
    {'name': 'Robert Lewandowski', 'team': 'Polonia', 'goals': 2},
    {'name': 'Memphis Depay', 'team': 'Paises Bajos', 'goals': 2},
]

def build_full_standings():
    all_teams = list(EXTRA_TEAMS)
    random.shuffle(all_teams)
    full = {}
    idx = 0
    for grp in sorted(REAL_GROUP_WINNERS.keys()):
        top2 = REAL_GROUP_WINNERS[grp]
        extra = all_teams[idx:idx+2]
        idx += 2
        full[grp] = list(top2) + extra
    return full

def generate_matches(standings):
    matches = []
    base_date = '2026-06-11'
    match_id = 1
    for grp in sorted(standings.keys()):
        teams = standings[grp]
        pairs = [(teams[0], teams[1]), (teams[2], teams[3]),
                 (teams[0], teams[2]), (teams[1], teams[3]),
                 (teams[0], teams[3]), (teams[1], teams[2])]
        for day_offset, (home, away) in enumerate(pairs):
            d = f'2026-06-{11 + day_offset:02d}'
            if grp in REAL_GROUP_WINNERS:
                h_score = random.randint(0, 4)
                a_score = random.randint(0, 4)
            else:
                h_score = random.randint(0, 3)
                a_score = random.randint(0, 3)
            matches.append({
                'id': match_id,
                'utcDate': f'{d}T{15 + match_id % 8}:00:00Z',
                'status': 'FINISHED',
                'homeTeam': home,
                'awayTeam': away,
                'homeScore': h_score,
                'awayScore': a_score,
                'group': grp,
            })
            match_id += 1

    top4_tuples = [
        ('2026-07-04', 'Espana', 'Argentina', 2, 1, 'FINISHED', 'SEMIFINAL'),
        ('2026-07-04', 'Francia', 'Brasil', 3, 0, 'FINISHED', 'SEMIFINAL'),
        ('2026-07-08', 'Argentina', 'Brasil', 0, 0, 'POSTPONED', '3RD_PLACE'),
        ('2026-07-09', 'Argentina', 'Brasil', 2, 1, 'FINISHED', '3RD_PLACE'),
        ('2026-07-14', 'Francia', 'Espana', 1, 2, 'FINISHED', 'FINAL'),
    ]
    for m_data in top4_tuples:
        d = m_data[0]; h = m_data[1]; a = m_data[2]
        hs = m_data[3]; as_ = m_data[4]; st = m_data[5]; grp = m_data[6]
        matches.append({
            'id': match_id,
            'utcDate': f'{d}T21:00:00Z',
            'status': st,
            'homeTeam': h,
            'awayTeam': a,
            'homeScore': hs,
            'awayScore': as_,
            'group': grp,
        })
        match_id += 1

    return sorted(matches, key=lambda m: m['utcDate'])


def calculate_points(participant, pred, standings, top4, scorers):
    points_groups = 0
    for grp, pred_teams in pred.get('group_predictions', {}).items():
        real_teams = standings.get(grp, [])
        if len(real_teams) >= 2:
            if pred_teams and pred_teams[0] and match_teams(pred_teams[0], real_teams[0]):
                points_groups += 2
            if len(pred_teams) > 1 and pred_teams[1] and len(real_teams) > 1 and match_teams(pred_teams[1], real_teams[1]):
                points_groups += 1

    points_scorers = 0
    for p_scorer in pred.get('scorers_predictions', []):
        for r_scorer in scorers:
            pn = normalize_string(p_scorer)
            rn = normalize_string(r_scorer['name'])
            if pn and rn and (pn == rn or pn in rn or rn in pn):
                points_scorers += r_scorer['goals'] * 2
                break

    points_top4 = 0
    for pos in ['1', '2', '3', '4']:
        pred_team = pred.get('top4_predictions', {}).get(pos, '')
        real_team = top4.get(pos, '')
        if pred_team and real_team and match_teams(pred_team, real_team):
            pts_map = {'1': 14, '2': 8, '3': 6, '4': 4}
            points_top4 += pts_map.get(pos, 0)

    total = points_groups + points_scorers + points_top4
    return total, points_groups, points_scorers, points_top4


def build_group_matches(pred, standings):
    result = {}
    for grp, pred_teams in pred.get('group_predictions', {}).items():
        real_teams = standings.get(grp, [])
        matches = []
        for idx, pt in enumerate(pred_teams):
            rt = real_teams[idx] if idx < len(real_teams) else None
            is_correct = bool(rt and match_teams(pt, rt)) if pt else False
            matches.append({
                'predicted_name': pt,
                'real_name': rt,
                'is_correct': is_correct,
            })
        result[grp] = matches
    return result


def build_scorer_matches(pred, scorers):
    matches = []
    for p_scorer in pred.get('scorers_predictions', []):
        match = None
        for r_scorer in scorers:
            pn = normalize_string(p_scorer)
            rn = normalize_string(r_scorer['name'])
            if pn and rn and (pn == rn or pn in rn or rn in pn):
                match = r_scorer
                break
        matches.append({
            'predicted_name': p_scorer,
            'real_name': match['name'] if match else None,
            'goals': match['goals'] if match else 0,
            'points': match['goals'] * 2 if match else 0,
        })
    return matches


def build_top4_matches(pred, top4):
    matches = []
    for pos in ['1', '2', '3', '4']:
        pred_team = pred.get('top4_predictions', {}).get(pos, '')
        real_team = top4.get(pos, '')
        is_correct = bool(pred_team and real_team and match_teams(pred_team, real_team))
        in_top4 = False
        if not is_correct and pred_team:
            for rt in top4.values():
                if rt and match_teams(pred_team, rt):
                    in_top4 = True
                    break
        pts_map = {'1': 14, '2': 8, '3': 6, '4': 4}
        points = pts_map.get(pos, 0) if is_correct else (2 if in_top4 else 0)
        matches.append({
            'position': pos,
            'predicted_name': pred_team,
            'real_name': real_team,
            'is_correct': is_correct,
            'points': points,
        })
    return matches


def main():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    participantes = data['participantes']
    predicciones_raw = data['predicciones']
    predicciones = {p['participant_id']: p for p in predicciones_raw}

    standings = build_full_standings()
    top4 = REAL_TOP4
    scorers = REAL_SCORERS

    jinxed_ids = set(random.sample([p['id'] for p in participantes], min(5, len(participantes))))
    scores = {}
    for p in participantes:
        pid = p['id']
        pred = predicciones.get(pid)
        if pred:
            total, pg, ps, pt4 = calculate_points(p, pred, standings, top4, scorers)
        else:
            total, pg, ps, pt4 = 0, 0, 0, 0
        scores[pid] = {
            'points_total': total,
            'points_groups': pg,
            'points_scorers': ps,
            'points_top4': pt4,
        }

    sorted_participants = sorted(participantes, key=lambda p: (-scores[p['id']]['points_total'], p['name']))
    ranked = []
    current_rank = 1
    for i, p in enumerate(sorted_participants):
        if i > 0 and scores[p['id']]['points_total'] < scores[sorted_participants[i-1]['id']]['points_total']:
            current_rank = i + 1
        prizes_pool = [1668.0, 834.0, 278.0]
        prize = 0.0
        if current_rank <= 3:
            tied = []
            for j in range(len(sorted_participants)):
                if scores[sorted_participants[j]['id']]['points_total'] == scores[p['id']]['points_total']:
                    tied.append(sorted_participants[j])
            if len(tied) > 1 and p in tied:
                total_prize = sum(prizes_pool[:len(tied)])
                prize = round(total_prize / len(tied), 2)
            elif current_rank == 1:
                prize = prizes_pool[0]
            elif current_rank == 2:
                prize = prizes_pool[1] if len(prizes_pool) > 1 else 0.0
            elif current_rank == 3:
                prize = prizes_pool[2] if len(prizes_pool) > 2 else 0.0
        jinx_count = random.randint(1, 3) if p['id'] in jinxed_ids else 0

        ranked.append({
            'id': p['id'],
            'name': p['name'],
            'points_total': scores[p['id']]['points_total'],
            'points_groups': scores[p['id']]['points_groups'],
            'points_scorers': scores[p['id']]['points_scorers'],
            'points_top4': scores[p['id']]['points_top4'],
            'rank': current_rank,
            'prize': prize,
            'jinx_count': jinx_count,
        })

    os.makedirs(DATA_DIR, exist_ok=True)
    parts_dir = os.path.join(DATA_DIR, 'participants')
    os.makedirs(parts_dir, exist_ok=True)

    # ranking.json
    with open(os.path.join(DATA_DIR, 'ranking.json'), 'w', encoding='utf-8') as f:
        json.dump(ranked, f, ensure_ascii=False, indent=2)
    print(f"ranking.json: {len(ranked)} participants")

    # participants.json (alphabetical for search dropdown)
    participants_list = sorted(ranked, key=lambda p: p['name'])
    with open(os.path.join(DATA_DIR, 'participants.json'), 'w', encoding='utf-8') as f:
        json.dump(participants_list, f, ensure_ascii=False, indent=2)
    print(f"participants.json: {len(participants_list)} participants")

    # Individual participant detail files
    for p in participantes:
        pid = p['id']
        pred = predicciones.get(pid)
        s = scores[pid]
        rank_entry = next(r for r in ranked if r['id'] == pid)

        jinxes = []
        if pid in jinxed_ids:
            for jid in range(1, random.randint(1, 3) + 1):
                jinxes.append({
                    'id': jid,
                    'created_at': '2026-07-06T12:00:00',
                    'expires_at': '2026-07-09T12:00:00',
                    'seconds_remaining': 172800,
                })

        detail = {
            'id': pid,
            'name': p['name'],
            'points_total': s['points_total'],
            'points_groups': s['points_groups'],
            'points_scorers': s['points_scorers'],
            'points_top4': s['points_top4'],
            'rank': rank_entry['rank'],
            'prize': rank_entry['prize'],
            'jinx_count': rank_entry['jinx_count'],
            'prediction': {
                'id': pred['participant_id'] if pred else 0,
                'participant_id': pred['participant_id'] if pred else 0,
                'group_predictions': pred['group_predictions'] if pred else {},
                'scorers_predictions': pred['scorers_predictions'] if pred else [],
                'top4_predictions': pred['top4_predictions'] if pred else {},
            } if pred else None,
            'scorer_matches': build_scorer_matches(pred, scorers) if pred else [],
            'group_matches': build_group_matches(pred, standings) if pred else {},
            'top4_matches': build_top4_matches(pred, top4) if pred else [],
            'active_jinxes': jinxes,
        }

        with open(os.path.join(parts_dir, f'{pid}.json'), 'w', encoding='utf-8') as f:
            json.dump(detail, f, ensure_ascii=False, indent=2)
    print(f"participants/: {len(participantes)} individual files")

    # scorers.json
    with open(os.path.join(DATA_DIR, 'scorers.json'), 'w', encoding='utf-8') as f:
        json.dump(scorers, f, ensure_ascii=False, indent=2)
    print(f"scorers.json: {len(scorers)} scorers")

    # results.json
    results = {
        'standings': standings,
        'top4': top4,
        'scorers': scorers,
    }
    with open(os.path.join(DATA_DIR, 'results.json'), 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("results.json: done")

    # matches.json
    matches = generate_matches(standings)
    with open(os.path.join(DATA_DIR, 'matches.json'), 'w', encoding='utf-8') as f:
        json.dump(matches, f, ensure_ascii=False, indent=2)
    print(f"matches.json: {len(matches)} matches")

    # next-update.json
    next_update = {
        'next_update_at': '2026-07-08T19:00:00+00:00',
        'countdown_seconds': 14400,
    }
    with open(os.path.join(DATA_DIR, 'next-update.json'), 'w', encoding='utf-8') as f:
        json.dump(next_update, f, ensure_ascii=False, indent=2)
    print("next-update.json: done")

    # Summary
    total_points = sum(s['points_total'] for s in scores.values())
    print(f"\nTotal participants: {len(participantes)}")
    print(f"Total points across all: {total_points}")
    print(f"Participants with jinxes: {len(jinxed_ids)}")
    print(f"Top 1: {ranked[0]['name']} - {ranked[0]['points_total']} pts")


if __name__ == '__main__':
    main()
