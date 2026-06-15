import sqlite3
import json

conexion = sqlite3.connect('uztargi_porra.db')
conexion.row_factory = sqlite3.Row
cursor = conexion.cursor()

# Participantes con su puntuación y ranking
cursor.execute("SELECT id, name, points_total, points_groups, points_scorers, points_top4, rank FROM participants ORDER BY rank")
participantes = [dict(row) for row in cursor.fetchall()]

# Predicciones (JSON anidado: group_predictions, scorers_predictions, top4_predictions)
cursor.execute("SELECT participant_id, group_predictions, scorers_predictions, top4_predictions FROM predictions")
predicciones = []
for row in cursor.fetchall():
    d = dict(row)
    for key in ('group_predictions', 'scorers_predictions', 'top4_predictions'):
        if isinstance(d[key], str):
            d[key] = json.loads(d[key])
    predicciones.append(d)

# Datos reales del torneo
cursor.execute("SELECT key, value FROM real_world_data")
datos_reales = {}
for row in cursor.fetchall():
    val = row['value']
    if isinstance(val, str):
        val = json.loads(val)
    datos_reales[row['key']] = val

datos = {
    "participantes": participantes,
    "predicciones": predicciones,
    "datos_reales": datos_reales
}

with open('datos_porra.json', 'w', encoding='utf-8') as f:
    json.dump(datos, f, ensure_ascii=False, indent=2)

print(f"✓ datos_porra.json generado — "
      f"{len(participantes)} participantes, {len(predicciones)} predicciones, {len(datos_reales)} datasets reales")
conexion.close()
