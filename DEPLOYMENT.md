# 🚀 Guía de Despliegue en Servidor - Porra Mundial 2026

Esta guía explica paso a paso cómo desplegar la aplicación en tu servidor de producción (`porrauztargi.korpoweb.com` / `178.104.213.192`) utilizando la rama local `server`.

En esta configuración, **Caddy corre 100% dentro de Docker**. No necesitas configurar Caddy en el host ni abrir puertos internos más allá de los estándares HTTP (80) y HTTPS (443).

---

## Paso 1: En tu máquina local (Desarrollo)

Asegúrate de estar en la rama `server` y de tener todos los cambios confirmados. Luego súbelos a tu repositorio en GitHub:

```bash
# 1. Verificar que estás en la rama 'server'
git checkout server

# 2. Confirmar los archivos preparados para el despliegue
git add .
git commit -m "chore: configurar despliegue de produccion con Caddy en Docker y robots.txt"

# 3. Subir la rama a GitHub
git push origin server
```

---

## Paso 2: En tu Servidor de Producción

### 1. Descargar o actualizar el código
Accede a tu servidor vía SSH y descarga los últimos cambios.

* **Si es la primera vez que clonas el proyecto en el servidor:**
  ```bash
  git clone -b server <URL_DE_TU_REPOSITORIO_GITHUB> porra
  cd porra
  ```

* **Si el proyecto ya está clonado en el servidor, cámbiate a la rama `server` y haz pull:**
  ```bash
  # Ve al directorio del proyecto
  cd /ruta/a/tu/proyecto/porra

  # Trae los cambios y cambia a la rama 'server'
  git fetch origin
  git checkout server
  git pull origin server
  ```

### 2. Configurar el archivo `.env`
Crea o sube el archivo `.env` en la raíz del proyecto (la carpeta `/porra`) con tus claves de producción:

```bash
nano .env
```

Y añade la clave de API real de producción:
```env
FOOTBALL_DATA_API_KEY="tu_api_key_real_de_produccion"
```

---

## Paso 3: Levantar los contenedores de Docker

Caddy se ejecutará automáticamente como un contenedor más. Se encargará de obtener los certificados SSL de forma segura, redireccionar todo el tráfico HTTP a HTTPS y bloquear los rastreadores y bots a través de `/robots.txt`.

Inicia todos los servicios compilándolos en segundo plano:

```bash
docker compose up --build -d
```

### Comandos útiles para monitorización:
* **Ver el estado de los contenedores:**
  ```bash
  docker compose ps
  ```
* **Ver los logs en tiempo real (útil para ver si Caddy ya tiene el SSL listo):**
  ```bash
  docker compose logs -f
  ```
* **Ver logs específicos de Caddy:**
  ```bash
  docker compose logs -f caddy
  ```
* **Detener la aplicación:**
  ```bash
  docker compose down
  ```

---

¡Eso es todo! Tu sitio web estará completamente seguro bajo HTTPS en `https://porrauztargi.korpoweb.com` y protegido contra bots. 🌟
