#!/bin/bash
echo "🚀 Levantando contenedores de Testing (Postgres y Redis aislados)..."
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Esperando 3 segundos a que Postgres inicialice..."
sleep 3

echo "🧪 Ejecutando la Suite de Pruebas de Estrés..."
# Exportamos variables directamente para Jest
export DATABASE_URL=postgres://postgres:postgres@localhost:5433/ticketrush_test
export JWT_SECRET=test-secret
export REDIS_HOST=localhost
export REDIS_PORT=6380
export HMAC_SECRET=test-secret

npm run test:e2e

echo "🧹 Limpiando el entorno de Testing..."
docker-compose -f docker-compose.test.yml down -v
echo "✅ Finalizado."
