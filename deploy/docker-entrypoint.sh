#!/bin/sh
# Funcionalidad: Punto de entrada del contenedor del backend
# Descripción: Aplica las migraciones pendientes con prisma migrate deploy antes de arrancar la aplicación y detiene el arranque si fallan
# Versión: 1.0
# Autor: Marcela Mazo Castro
# Proyecto: VentyLab
# Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
# Institución: Universidad del Valle
# Contacto: marcela.mazo@correounivalle.edu.co
set -eu

if [ -z "${DATABASE_URL:-}" ] || [ -z "${DIRECT_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL and DIRECT_URL must be set" >&2
  exit 1
fi

echo "[entrypoint] applying database migrations (prisma migrate deploy)"

# Prisma migrates through DIRECT_URL (directUrl in schema.prisma), so a pooled DATABASE_URL is fine.
if ! node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema /app/prisma/schema.prisma; then
  echo "[entrypoint] prisma migrate deploy failed; refusing to start the application" >&2
  exit 1
fi

echo "[entrypoint] migrations applied; starting: $*"

exec "$@"
