import sys
import os
import random
from datetime import datetime, timezone, timedelta

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
os.chdir(backend_dir)

from app.database import SessionLocal
from app.models import Participant, Jinx


def repartir_jinx():
    db = SessionLocal()
    try:
        participants = db.query(Participant).all()
        if len(participants) < 3:
            print(f"Error: se necesitan al menos 3 participantes (hay {len(participants)})")
            return

        elegidos = random.sample(participants, 3)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        expires_at = now + timedelta(days=3)

        p = elegidos[0]
        for _ in range(5):
            db.add(Jinx(target_id=p.id, created_at=now, expires_at=expires_at))
        print(f"  {p.name}: +5 jinxes")

        for p in elegidos[1:]:
            db.add(Jinx(target_id=p.id, created_at=now, expires_at=expires_at))
            print(f"  {p.name}: +1 jinx")

        db.commit()
        print(f"\nReparto completado: {elegidos[0].name} (5) | {elegidos[1].name} (1) | {elegidos[2].name} (1)")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    repartir_jinx()
