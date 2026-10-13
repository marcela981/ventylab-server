#!/usr/bin/env bash
# Funcionalidad: Restauración de un respaldo de PostgreSQL
# Descripción: Restaura con pg_restore un respaldo en formato custom sobre la base de datos destino indicada, en una sola transacción y deteniéndose en el primer error; exige la bandera --confirm con el nombre exacto de la base destino porque reemplaza los objetos existentes; usa el pg_restore local o el de una imagen postgres en Docker
# Versión: 1.0
# Autor: Marcela Mazo Castro
# Proyecto: VentyLab
# Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
# Institución: Universidad del Valle
# Contacto: marcela.mazo@correounivalle.edu.co
#
# Usage: RESTORE_DATABASE_URL=postgresql://user:pass@host:5432/db scripts/backup/pg-restore.sh <file.dump> --confirm <db>
#   <db> must equal the database name in RESTORE_DATABASE_URL; existing objects in the dumped schema are dropped and recreated.
#   PG_DOCKER_IMAGE default postgres:17-alpine; used when pg_restore is not installed or USE_DOCKER=1
set -euo pipefail

usage() {
  echo "usage: RESTORE_DATABASE_URL=<libpq url> $0 <file.dump> --confirm <target database name>" >&2
  exit 2
}

[[ $# -eq 3 ]] || usage
[[ "$2" == "--confirm" ]] || usage

DUMP_FILE="$1"
CONFIRMED_NAME="$3"

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required (libpq connection URL of the target database)}"

PG_DOCKER_IMAGE="${PG_DOCKER_IMAGE:-postgres:17-alpine}"
USE_DOCKER="${USE_DOCKER:-0}"

if [[ ! -s "$DUMP_FILE" ]]; then
  echo "[pg-restore] dump file not found or empty: ${DUMP_FILE}" >&2
  exit 1
fi

# Database name = path of the URL, without query string.
TARGET_NAME="${RESTORE_DATABASE_URL%%\?*}"
TARGET_NAME="${TARGET_NAME##*/}"

if [[ -z "$TARGET_NAME" || "$TARGET_NAME" != "$CONFIRMED_NAME" ]]; then
  echo "[pg-restore] --confirm '${CONFIRMED_NAME}' does not match the target database '${TARGET_NAME}'; nothing was changed" >&2
  exit 1
fi

RESTORE_ARGS=(--clean --if-exists --no-owner --no-acl --single-transaction --exit-on-error --dbname="$RESTORE_DATABASE_URL")

echo "[pg-restore] restoring ${DUMP_FILE} into database '${TARGET_NAME}'"

if [[ "$USE_DOCKER" != "1" ]] && command -v pg_restore > /dev/null 2>&1; then
  pg_restore "${RESTORE_ARGS[@]}" "$DUMP_FILE"
else
  # The dump is streamed through stdin so the container needs no access to the host folder.
  docker run --rm -i --network host -e PGCONNECT_TIMEOUT=15 "$PG_DOCKER_IMAGE" pg_restore "${RESTORE_ARGS[@]}" < "$DUMP_FILE"
fi

echo "[pg-restore] restore finished"
