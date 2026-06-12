# Sincronización manual con football-data.org

## Requisito
Tener una API key de https://www.football-data.org/

## Ejecutar el script de sincronización

Exportar la API key y ejecutar:

```bash
export FOOTBALL_DATA_API_KEY="tu-api-key-real"
cd /home/asier/dv/proyectos/uztargi_mundial/backend && source venv/bin/activate && python scripts/run_sync.py
```

O inline (sin exportar):

```bash
cd /home/asier/dv/proyectos/uztargi_mundial/backend && source venv/bin/activate && FOOTBALL_DATA_API_KEY="tu-api-key-real" python scripts/run_sync.py
```

## Usando .env (alternativa recomendada)

Crear `backend/.env`:

```
FOOTBALL_DATA_API_KEY=tu-api-key-real
```

Y ejecutar con python-dotenv:

```bash
cd /home/asier/dv/proyectos/uztargi_mundial/backend && source venv/bin/activate && python -c "from dotenv import load_dotenv; load_dotenv(); import scripts.run_sync"
```
