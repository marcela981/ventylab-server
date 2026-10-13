#!/usr/bin/env bash
# Funcionalidad: Respaldo de la base de datos PostgreSQL
# Descripción: Genera con pg_dump un respaldo en formato custom con marca de tiempo UTC del esquema indicado (public por defecto), lo escribe de forma atómica en el directorio de respaldos y elimina los respaldos más antiguos que la retención; usa el pg_dump local o, si no existe o se pide, el de una imagen postgres en Docker
# Versión: 1.0
# Autor: Marcela Mazo Castro
# Proyecto: VentyLab
# Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
# Institución: Universidad del Valle
# Contacto: marcela.mazo@correounivalle.edu.co
#
# Usage: BACKUP_DATABASE_URL=postgresql://user:pass@host:5432/db scripts/backup/pg-backup.sh
#   BACKUP_DATABASE_URL   required; a libpq URL to a direct (non-pooled) connection, e.g. the DIRECT_URL value
#                         without Prisma-only query parameters (pgbouncer, connection_limit, pool_timeout, schema)
#   BACKUP_DIR            default ./backups
#   BACKUP_RETENTION_DAYS default 14 (dumps older than this are deleted after a successful dump; 0 disables pruning)
#   BACKUP_SCHEMA         default public (the only schema Prisma manages; avoids provider-internal schemas)
#   BACKUP_PREFIX         default ventylab
#   PG_DOCKER_IMAGE       default postgres:17-alpine; used when pg_dump is not installed or USE_DOCKER=1
set -euo pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is required (direct libpq connection URL)}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
BACKUP_SCHEMA="${BACKUP_SCHEMA:-public}"
BACKUP_PREFIX="${BACKUP_PREFIX:-ventylab}"
PG_DOCKER_IMAGE="${PG_DOCKER_IMAGE:-postgres:17-alpine}"
USE_DOCKER="${USE_DOCKER:-0}"

if ! [[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "[pg-backup] BACKUP_RETENTION_DAYS must be a non-negative integer" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_DIR="$(cd "$BACKUP_DIR" && pwd)"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE_NAME="${BACKUP_PREFIX}-${TIMESTAMP}.dump"
TARGET="${BACKUP_DIR}/${FILE_NAME}"
PARTIAL="${TARGET}.partial"

cleanup() {
  rm -f "$PARTIAL"
}
trap cleanup EXIT

DUMP_ARGS=(--format=custom --no-owner --no-acl --schema="$BACKUP_SCHEMA" --dbname="$BACKUP_DATABASE_URL")

echo "[pg-backup] dumping schema '${BACKUP_SCHEMA}' to ${TARGET}"

if [[ "$USE_DOCKER" != "1" ]] && command -v pg_dump > /dev/null 2>&1; then
  pg_dump "${DUMP_ARGS[@]}" --file="$PARTIAL"
else
  # The dump goes to stdout so the container needs no write access to the host folder; --network host reaches localhost databases.
  docker run --rm --network host -e PGCONNECT_TIMEOUT=15 "$PG_DOCKER_IMAGE" pg_dump "${DUMP_ARGS[@]}" > "$PARTIAL"
fi

if [[ ! -s "$PARTIAL" ]]; then
  echo "[pg-backup] dump is empty; aborting" >&2
  exit 1
fi

mv "$PARTIAL" "$TARGET"

echo "[pg-backup] wrote ${TARGET} ($(wc -c < "$TARGET") bytes)"

if [[ "$BACKUP_RETENTION_DAYS" -gt 0 ]]; then
  find "$BACKUP_DIR" -maxdepth 1 -type f -name "${BACKUP_PREFIX}-*.dump" -mtime +"$BACKUP_RETENTION_DAYS" -print -delete \
    | sed 's/^/[pg-backup] pruned /'
fi
