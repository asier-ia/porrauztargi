import sys
import os

# Load .env from project root (optional: solo necesario fuera del contenedor Docker)
try:
    from dotenv import load_dotenv
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    load_dotenv(dotenv_path)
except ImportError:
    pass

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.sync import sync_all_data
import asyncio


def run_sync():
    print("Ejecutando sincronización manual con la API...")
    db = next(get_db())
    try:
        result = asyncio.run(sync_all_data(db))
        if result:
            print("Sincronización completada: datos actualizados y puntos recalculados.")
        else:
            print("Sincronización omitida (sin API key o sin datos nuevos).")
    except Exception as e:
        print(f"Error durante la sincronización: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run_sync()
