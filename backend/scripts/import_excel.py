import sys
import os
import pandas as pd
import json

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models import Participant, Prediction, RealWorldData

def import_excel_data():
    excel_path = '/home/asier/dv/proyectos/uztargi_mundial/Porra Mundial 2026.xlsx'
    
    if not os.path.exists(excel_path):
        print(f"Error: No se encontró el archivo Excel en {excel_path}")
        return

    print("Cargando el archivo Excel con Pandas...")
    df = pd.read_excel(excel_path, sheet_name='Table 1')
    
    # El archivo tiene la fila 0 como cabeceras reales, la fila 1 en adelante son datos
    headers = df.iloc[0].tolist()
    df_data = df.iloc[1:].copy()
    df_data.columns = headers
    
    # Limpiar nombres de columnas
    df_data.columns = [str(c).strip() for c in df_data.columns]

    print("Recreando las tablas de la base de datos (limpieza total)...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Inicializar datos vacíos del mundo real para la fase de inicio
        # Estos se actualizarán luego mediante la API o administración
        print("Inicializando datos reales vacíos para el Mundial 2026...")
        real_standings = {g: ["", ""] for g in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']}
        real_scorers = []
        real_top4 = {"1": "", "2": "", "3": "", "4": ""}
        
        db.add(RealWorldData(key="standings", value=real_standings))
        db.add(RealWorldData(key="scorers", value=real_scorers))
        db.add(RealWorldData(key="top4", value=real_top4))
        db.commit()

        print("Importando participantes...")
        participants_saved = 0
        seen_names = {}
        
        for index, row in df_data.iterrows():
            name = str(row['Nombre']).strip()
            if not name or name == 'nan' or name == '':
                continue
            
            # Hacer que los nombres sean únicos si están duplicados
            if name in seen_names:
                seen_names[name] += 1
                name = f"{name} ({seen_names[name]})"
            else:
                seen_names[name] = 1
                
            # Extraer goleadores (4)
            scorers_preds = [
                str(row['Goleador 1']).strip() if pd.notna(row['Goleador 1']) else "",
                str(row['Goleador 2']).strip() if pd.notna(row['Goleador 2']) else "",
                str(row['Goleador 3']).strip() if pd.notna(row['Goleador 3']) else "",
                str(row['Goleador 4']).strip() if pd.notna(row['Goleador 4']) else ""
            ]
            # Eliminar vacíos
            scorers_preds = [s for s in scorers_preds if s]

            # Extraer grupos (A-L, 12 grupos)
            group_preds = {}
            for g in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']:
                col_1 = f'Grupo {g} - 1º'
                col_2 = f'Grupo {g} - 2º'
                
                team_1 = str(row[col_1]).strip() if pd.notna(row[col_1]) else ""
                team_2 = str(row[col_2]).strip() if pd.notna(row[col_2]) else ""
                
                group_preds[g] = [team_1, team_2]

            # Extraer Top 4
            top4_preds = {
                "1": str(row['Campeón']).strip() if pd.notna(row['Campeón']) else "",
                "2": str(row['Subcampeón']).strip() if pd.notna(row['Subcampeón']) else "",
                "3": str(row['3º Puesto']).strip() if pd.notna(row['3º Puesto']) else "",
                "4": str(row['4º Puesto']).strip() if pd.notna(row['4º Puesto']) else ""
            }

            # Crear participante
            participant = Participant(
                name=name,
                points_total=0,
                points_groups=0,
                points_scorers=0,
                points_top4=0,
                rank=None
            )
            
            prediction = Prediction(
                group_predictions=group_preds,
                scorers_predictions=scorers_preds,
                top4_predictions=top4_preds,
                participant=participant
            )

            db.add(participant)
            participants_saved += 1

        db.commit()
        print(f"Éxito: Se han importado {participants_saved} participantes reales desde el Excel.")

        # Asignar rangos iniciales alfabéticamente o todos con rango 1
        participants = db.query(Participant).order_by(Participant.name.asc()).all()
        for idx, p in enumerate(participants, 1):
            p.rank = idx
        db.commit()
        print("Rangos iniciales asignados correctamente.")

    except Exception as e:
        db.rollback()
        print(f"Error al importar los datos: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    import_excel_data()
