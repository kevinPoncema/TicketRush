#!/bin/bash
echo "🚀 Levantando infraestructura de Testing y ejecutando pruebas E2E..."
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

echo "🧹 Limpiando el entorno de Testing..."
docker-compose -f docker-compose.test.yml down -v
echo "✅ Finalizado."
