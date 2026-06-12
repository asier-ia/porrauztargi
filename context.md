# Contexto del Proyecto: Plataforma "Porra Mundial 2026 - Bar Uztargi"

## 🎯 Objetivo del Proyecto
Desarrollar una aplicación web (Single Page Application - SPA) mobile-first para automatizar y gestionar una porra del Mundial de Fútbol 2026 organizada por el bar "Uztargi". La plataforma dará servicio a 140 participantes, calculando sus puntos de manera automática en base a los resultados reales de la competición.

## 🛠️ Stack Tecnológico
- **Frontend:** React + Vite + Tailwind CSS (Diseño UI/UX gestionado mediante componentes tipo *shadcn/ui* o clases puras de Tailwind).
- **Backend:** FastAPI (Python).
- **Base de Datos:** SQLite (Elegido por encima de PostgreSQL para maximizar la velocidad de desarrollo e implementación en el MVP).
- **Fuente de Datos Externa:** API gratuita de `football-data.org` (Plan comunitario).

## ⚙️ Arquitectura y Flujo de Datos
Para evitar superar los límites de llamadas gratuitas de la API de fútbol, el sistema funcionará con el siguiente flujo de caché:
1. **Extracción Inicial (Única vez):** Un script leerá las predicciones de los 140 participantes (desde un archivo CSV/JSON convertido previamente del PDF original) y las cargará en SQLite. Estructura de apuesta: Puestos de Grupos, Goleadores y Top 4 Final.
2. **Actualización (Cron/Diaria):** El backend en Python/FastAPI consultará `football-data.org` (`/standings` para grupos y `/scorers` para pichichis) una o dos veces al día.
3. **Cálculo:** El backend cruzará los resultados reales con las predicciones de SQLite, calculará las nuevas puntuaciones y actualizará la base de datos.
4. **Consumo:** El frontend de React consultará a FastAPI mediante *endpoints* simples para consumir los datos ya procesados.

## 📱 Vistas del Frontend (UI Mobile-First)
La interfaz principal constará de un Header fijo con el título "Porra Mundial - Uztargi" y una barra de navegación inferior (Bottom Navigation) con 4 pestañas:

### 1. Ranking (Vista Principal)
- **Título:** "Top 10 Porra"
- **Contenido:** Tabla limpia mostrando las posiciones 1 al 10.
- **Datos:** Posición (Top 3 destacado visualmente), Nombre del participante, Puntos Totales.

### 2. Mi Perfil
- **Buscador:** Componente `Select` o barra de búsqueda para encontrar al participante entre los 140 inscritos.
- **Tarjeta de Resultados (Card):**
  - Posición actual en el ranking global.
  - Puntos Totales.
  - **Desglose de puntos:** 
    - Fase de Grupos: X pts
    - Goleadores: Y pts
    - Top 4 Final: Z pts

### 3. Goleadores (Realidad)
- **Título:** "Top 10 Goleadores del Mundial"
- **Contenido:** Tabla que refleja la realidad del torneo sacada de la API.
- **Datos:** Jugador (Selección) y Goles totales.

### 4. Info & Apoyo (Donaciones)
- **Título:** "Sobre este proyecto"
- **Tarjeta Principal (Donate):** Texto cercano explicando que la plataforma ha sido desarrollada de forma voluntaria para automatizar la porra del bar, asumiendo los costes de servidor. Incluye un botón CTA llamativo (ej. "Invítame a una cerveza 🍺" o "Donar vía PayPal").
- **Tarjeta Secundaria (Contacto - Actualmente Oculta):** Componente preparado con enlaces al portfolio, LinkedIn e Instagram del desarrollador. Mantener con la clase `hidden` de Tailwind para su futura activación.

---

## ⚽ Sistema de Puntuación Oficial

> **Nota:** Los goles en tandas de penaltis (después de la prórroga) NO cuentan.
> Los goles de penalti dentro del partido regular SÍ cuentan.

### Fase de Grupos (por cada grupo)
| Acierto | Puntos |
|---------|--------|
| Elegir el **1º clasificado** exacto del grupo | **2 pts** |
| Elegir el **2º clasificado** exacto del grupo | **1 pt** |

### Goleadores
| Acierto | Puntos |
|---------|--------|
| Por cada gol de los goleadores seleccionados | **2 pts por gol** |

### Fase Final (Top 4 del Mundial)
| Acierto | Puntos |
|---------|--------|
| Acertar el **Campeón** (1º) | **14 pts** |
| Acertar el **Subcampeón** (2º) | **8 pts** |
| Acertar el **3º puesto** | **6 pts** |
| Acertar el **4º puesto** | **4 pts** |