# Porra Mundial 2026 — Bar Uztargi

Web para gestionar la porra del Mundial 2026 del Bar Uztargi. Los participantes hacen sus pronósticos (fase de grupos, goleadores y Top 4) y la web calcula puntuaciones en tiempo real según los resultados reales del torneo.

---

## Stack técnico

| Capa        | Tecnología                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | React 19 + Vite + Tailwind CSS + Lucide icons              |
| Backend     | Python 3 + FastAPI + SQLAlchemy + SQLite                   |
| Proxy       | Caddy (TLS automático, reverse proxy)                      |
| Infra       | Docker Compose (3 servicios: backend, frontend, caddy)     |
| Sincronización | football-data.org API (HTTP)                            |
| Pagos       | Stripe (donaciones)                                         |

---

## Estructura del proyecto

```
uztargi_mundial/
├── frontend/              # React SPA (Vite)
│   ├── src/
│   │   ├── App.jsx        # Componente principal, routing de tabs
│   │   ├── views/         # 4 vistas (Ranking, Profile, Scorers, Info)
│   │   ├── context/       # LanguageContext (ES/EU)
│   │   ├── i18n/          # Traducciones ES/EU
│   │   └── main.jsx       # Entry point
│   └── index.html
├── backend/               # FastAPI
│   └── app/
│       ├── main.py        # API REST (FastAPI)
│       ├── models.py      # SQLAlchemy models (Participant, Prediction, RealWorldData)
│       ├── schemas.py     # Pydantic schemas
│       ├── scoring.py     # Lógica de puntuación y matching de equipos
│       ├── sync.py        # Sincronización con football-data.org
│       └── database.py    # Conexión SQLite
├── docker-compose.yml     # Frontend + Backend + Caddy
├── Caddyfile              # Config reverse proxy
└── uztargi_porra.db       # Base de datos SQLite
```

---

## Funcionalidades

### 1. Ranking (/ranking)
- Tabla clasificatoria con todos los participantes ordenados por puntos
- **Podio**: top 3 destacado (oro, plata, bronce) con premios
- **Banner de premios**: 1º (1.668€), 2º (834€), 3º (278€) + donación solidaria a AFAGI (278€)
- Actualización automática cada 4h (vía countdown sincronizado con el servidor)
- Cada fila es clickable → lleva al perfil del participante

### 2. Perfil (/profile)
- Buscador con autocomplete de participantes
- Muestra:
  - Puntos totales y desglose (grupos / goleadores / top 4)
  - Predicciones de fase de grupos (A-L) con check verde si acierta la posición exacta, check十 si el equipo clasificó aunque no en la posición exacta
  - Predicciones de goleadores con puntos calculados (2pts por gol)
  - Predicciones de Top 4 con puntos según posición

### 3. Goleadores (/scorers)
- Tabla de goleadores reales del torneo
- Pichichi destacado en tarjeta ámbar
- Barras de progreso proporcionales al líder

### 4. Info (/info)
- Sobre el creador (Asier Iglesias)
- Donaciones vía Stripe (4 niveles: café 1.50€, caña 3€, cena 15€, sueño "lo que sea")
- Compromiso solidario: 10% de beneficios a AFAGI
- Contacto vía Instagram
- Descargo de responsabilidad legal y cookies

### 5. Popup "Tarjeta Amarilla" 🟨
- Aparece tras 3 minutos navegando
- Estilo arbitral: invita a "sobornar al árbitro" donando vía Stripe
- Humorístico, se puede cerrar

---

## Sistema de puntuación

| Categoría       | Detalle                                           | Puntos                      |
|-----------------|---------------------------------------------------|-----------------------------|
| Fase de grupos  | Acertar 1º de grupo                               | 2 pts por grupo             |
|                 | Acertar 2º de grupo                               | 1 pt por grupo              |
| Goleadores      | Por cada gol que marque el jugador seleccionado   | 2 pts por gol               |
| Top 4           | Campeón                                           | 14 pts                      |
|                 | Subcampeón                                        | 8 pts                       |
|                 | 3º puesto                                         | 6 pts                       |
|                 | 4º puesto                                         | 4 pts                       |

Los nombres de los equipos se normalizan para matchear entre español (Excel) e inglés (API). Ej: "Alemania" → "Germany".

---

## Sincronización de datos

- El servidor consulta **football-data.org** cada 4 horas automáticamente
- Sincroniza: clasificaciones de grupos, goleadores y Top 4
- También hay un endpoint manual: `POST /api/admin/update-results`
- API key requerida: `FOOTBALL_DATA_API_KEY` (variable de entorno)

---

## Internacionalización

- Soporte **ES** (español) y **EU** (euskera)
- Toggle en el header
- Traducciones completas en `frontend/src/i18n/translations.js`

---

## API REST (endpoints)

| Método | Ruta                          | Descripción                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/`                           | Health check                            |
| GET    | `/api/next-update`            | Tiempo restante para próxima sincro     |
| GET    | `/api/ranking?limit=N`       | Ranking de participantes                |
| GET    | `/api/participants`           | Lista de participantes                  |
| GET    | `/api/participants/{id}`      | Detalle + predicciones de un participante |
| GET    | `/api/scorers`                | Goleadores reales                       |
| GET    | `/api/results`                | Resultados reales (grupos + top 4)      |
| POST   | `/api/admin/update-results`   | Actualizar datos manualmente            |

---

## Despliegue

Con Docker Compose:

```bash
docker-compose up -d
```

Caddy expone en puertos 80/443 y hace reverse proxy a frontend (Vite dev server) y backend (FastAPI en :8000). En producción, los puertos directos de backend y frontend están comentados para forzar el paso por Caddy.
