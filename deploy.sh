#!/bin/bash
set -e

MODE="${1:-push}"

if [ "$MODE" = "push" ]; then
    echo "=== Subiendo cambios a GitHub ==="
    git add .
    git status
    echo
    read -p "Mensaje del commit: " MSG
    if [ -z "$MSG" ]; then
        MSG="chore: $(date +%Y-%m-%d)"
    fi
    git commit -m "$MSG"
    git push origin server
    echo
    echo "=== ✓ Pusheado ==="
    echo ""
    echo "Ahora en el SERVidor ejecuta:"
    echo "  ssh usuario@tuserver"
    echo "  cd /ruta/a/porra && bash deploy.sh server"
    echo ""

elif [ "$MODE" = "server" ]; then
    echo "=== Actualizando codigo en servidor ==="
    git pull origin server

    echo ""
    echo "=== Reconstruyendo y levantando contenedores ==="
    docker compose up --build -d

    echo ""
    echo "=== ✓ Desplegado ==="
    docker compose ps

else
    echo "Uso: bash deploy.sh          # Local: commit + push"
    echo "     bash deploy.sh server   # Server: pull + rebuild"
    exit 1
fi
