#!/bin/sh
# Arranque del backend en contenedor: aplica migraciones, siembra datos de
# ejemplo (idempotente) y levanta gunicorn.
set -e

echo "==> Aplicando migraciones…"
python manage.py migrate --noinput

echo "==> Sembrando datos de ejemplo (idempotente)…"
python manage.py seed_demo

echo "==> Iniciando gunicorn en 0.0.0.0:8000…"
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
