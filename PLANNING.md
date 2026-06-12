# 📋 Plan de Sincronización y Datos Reales: Porra Mundial 2026

Este archivo sirve para llevar el control del progreso de la implementación de la automatización de datos, la importación del Excel con Pandas y la integración de la API.

---

## 🚀 Progreso General

- [x] **Fase 1: Importación de Datos Reales del Excel (Pandas)**
  - [x] Crear script `backend/scripts/import_excel.py`.
  - [x] Limpiar base de datos SQLite.
  - [x] Importar los 139 participantes reales, sus 4 goleadores y las predicciones de los 12 grupos (A-L).
  - [x] Verificar la correcta inserción en SQLite.

- [x] **Fase 2: Motor de Cálculo y Diccionario de Traducción**
  - [x] Crear mapeador de nombres de equipos (Castellano ↔ Inglés API).
  - [x] Crear normalizador para nombres de goleadores (soporte para aciertos de nombres con/sin tildes o abreviaciones).
  - [x] Actualizar el motor de cálculo de puntos en el backend para reflejar las nuevas reglas:
    - [x] Grupos: 2 pts por 1º, 1 pt por 2º.
    - [x] Goleadores: 2 pts por cada gol real (excluyendo tandas de penaltis).
    - [x] Top 4: Campeón (14 pts), Subcampeón (8 pts), 3º (6 pts), 4º (4 pts).

- [x] **Fase 3: Sincronizador en Segundo Plano (Cron Autónomo)**
  - [x] Implementar un planificador asíncrono en `backend/app/main.py` que se ejecute cada 4 horas.
  - [x] Integrar consumo de `football-data.org` con API Key.
  - [x] Implementar sistema de **Fallback** (si la API falla, mantiene datos y permite simulación admin para testing offline).
  - [x] Crear endpoint `/api/next-update` para temporizador.
  - [x] Crear endpoint `/api/admin/update-results` para simulación del administrador.

- [x] **Fase 4: Frontend dinámico (React)**
  - [x] Crear visualización de la cuenta atrás en la cabecera de la App (`App.jsx`).
  - [x] Adaptar la vista `Profile.jsx` para dar soporte a los 12 grupos (A-L).
  - [x] Adaptar la vista `Profile.jsx` para mostrar los 4 goleadores con su desglose de puntos.
  - [x] Verificar el comportamiento responsive en Desktop y Móvil.

- [x] **Fase 5: Dockerización y Limpieza de Demo**
  - [x] Eliminar archivos de prueba antiguos (`seed_demo.py`).
  - [x] Eliminar PostgreSQL y Adminer de `docker-compose.yml`.
  - [x] Configurar Docker para utilizar SQLite con persistencia directa en el host (`backend/uztargi_porra.db`).
  - [x] Añadir variable `FOOTBALL_DATA_API_KEY` al contenedor de backend.

- [x] **Fase 6: Reparto de Premios Dinámico, Empates y Donación a Afagi**
  - [x] Implementar asignación de `rank` compartido en `scoring.py`.
  - [x] Añadir campo `prize` en `schemas.py`.
  - [x] Crear función matemática de reparto de premios en `main.py` bajo `/api/ranking`.
  - [x] Añadir tarjeta informativa de premios y donación en `Ranking.jsx`.
  - [x] Mostrar etiqueta del premio actual en tiempo real en la lista de clasificados.
  - [x] Detallar la causa de Afagi en la pestaña de `Info.jsx`.

- [x] **Fase 7: Rediseño Personal de Info.jsx e Integración de Stripe / Redes Sociales**
  - [x] Añadir foto de perfil (`/profile.png`) con un diseño redondeado y un distintivo con corazón.
  - [x] Redactar un mensaje humilde, sincero y cercano sobre la dedicación voluntaria y costes asumidos de hosting sin ánimo de lucro comercial.
  - [x] Implementar 4 botones de aportaciones seguras con Stripe en cuadrícula 2x2 utilizando las imágenes locales (`/cafe.png`, `/cana.png`, `/pizza.png`, `/sueno.png`):
    - [x] Invitar a un café (1,50 €)
    - [x] Invitar a una caña (3,00 €)
    - [x] Invitar a una cena (15,00 €)
    - [x] Financia mis horas de sueño (Cualquier ayuda)
  - [x] Añadir una nota extra y cercana prometiendo donar de corazón el 10% de cualquier beneficio a AFAGI.
  - [x] Crear un apartado de contacto minimalista y elegante para Instagram (`@asier_iglesias21`) con icono SVG.
  - [x] Eliminar los bloques e iconos toscos (como `<>`) para un acabado moderno y limpio.
  - [x] Verificar compilación impecable en React.

---

## 📊 Notas Técnicas de Desarrollo

- **Ruta Base de Datos:** `/home/asier/dv/proyectos/uztargi_mundial/uztargi_porra.db`
- **Archivo Excel:** `/home/asier/dv/proyectos/uztargi_mundial/Porra Mundial 2026.xlsx`
- **Límite de API:** 10 requests/minuto (la actualización de 4 horas evita cualquier bloqueo).
