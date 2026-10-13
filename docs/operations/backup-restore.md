<!--
  Funcionalidad: Procedimiento de respaldo y restauración de PostgreSQL
  Descripción: Cómo generar respaldos con marca de tiempo y retención, programarlos, restaurarlos con confirmación explícita y probar cada respaldo restaurándolo en un contenedor desechable y comparando conteos por tabla
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Backup and restore

Scripts: `scripts/backup/pg-backup.sh` and `scripts/backup/pg-restore.sh` (bash; Linux/macOS, Git Bash or WSL). Both use the local `pg_dump`/`pg_restore` when installed, otherwise (or with `USE_DOCKER=1`) the ones in `postgres:17-alpine` (`PG_DOCKER_IMAGE`). The client major version must be at least the server's.

## What is backed up

- The `public` schema (`BACKUP_SCHEMA`), the only one Prisma manages: tables, data, sequences, functions and the triggers (`protect_superadmin()`, append-only `audit_logs`), plus `_prisma_migrations`, so a restored database is already at the right migration.
- Not included: Supabase internal schemas (`auth`, `storage`, ...), roles and grants (`--no-owner --no-acl`), uploaded media (Supabase Storage), InfluxDB telemetry, Node-RED flows (`node_red_data` volume) and Mosquitto persistence (`mosquitto_data` volume).

## Backup

Use the direct connection (the `DIRECT_URL` value) without Prisma-only query parameters (`pgbouncer`, `connection_limit`, `pool_timeout`, `schema`); libpq rejects them. Keep `sslmode=require` when the provider needs it.

```bash
BACKUP_DATABASE_URL='postgresql://user:change-me@db.example.com:5432/postgres?sslmode=require' \
BACKUP_DIR=/var/backups/ventylab BACKUP_RETENTION_DAYS=14 \
  scripts/backup/pg-backup.sh
```

Output: `<BACKUP_DIR>/ventylab-YYYYMMDDTHHMMSSZ.dump` (custom format, compressed). The dump is written to a `.partial` file and renamed only when it is complete and not empty; after a successful dump, files `ventylab-*.dump` older than `BACKUP_RETENTION_DAYS` are deleted (`0` keeps all).

When the database is the bundled `postgres` service (compose profile `postgres`), its port is not published; run the dump inside the container instead:

```bash
docker compose exec -T postgres pg_dump -U ventylab -d ventylab --format=custom --no-owner --no-acl --schema=public \
  > /var/backups/ventylab/ventylab-$(date -u +%Y%m%dT%H%M%SZ).dump
```

### Schedule (VPS)

```cron
# /etc/cron.d/ventylab-backup — daily at 03:15 UTC; the env file holds BACKUP_DATABASE_URL and is readable by root only
15 3 * * * root set -a; . /etc/ventylab/backup.env; set +a; /opt/ventylab/scripts/backup/pg-backup.sh >> /var/log/ventylab-backup.log 2>&1
```

Copy the dumps off the server as well (another host or object storage); a backup on the same disk does not survive the loss of the VPS.

## Restore

`pg-restore.sh` drops and recreates the objects of the dumped schema in the target database, in a single transaction that stops at the first error (on failure nothing changes). It requires `--confirm` with the exact target database name:

```bash
RESTORE_DATABASE_URL='postgresql://user:change-me@db.example.com:5432/ventylab' \
  scripts/backup/pg-restore.sh /var/backups/ventylab/ventylab-20261012T031500Z.dump --confirm ventylab
```

Stop the backend before restoring into the live database (`docker compose stop backend`) and start it afterwards; the entrypoint then applies any migration newer than the backup. If the target's `public` schema contains objects that are not in the dump (for example extensions), `DROP SCHEMA public` fails and the transaction rolls back; restore into an empty database in that case.

## Restore test (every backup policy needs one)

Restore the newest dump into a throwaway container and compare row counts with the source. Nothing touches the real database except the read-only count query.

```bash
DUMP=$(ls -t /var/backups/ventylab/ventylab-*.dump | head -n 1)

# 1. Throwaway PostgreSQL (removed at the end).
docker run -d --name ventylab-restore-test -e POSTGRES_PASSWORD=restore-test -e POSTGRES_DB=restore_test postgres:17-alpine
until docker exec ventylab-restore-test pg_isready -U postgres -d restore_test > /dev/null 2>&1; do sleep 1; done

# 2. Restore inside the container (the dump goes through stdin).
docker exec -i ventylab-restore-test pg_restore -U postgres -d restore_test \
  --clean --if-exists --no-owner --no-acl --single-transaction --exit-on-error < "$DUMP"

# 3. Row counts per table (run the same query against the source and compare).
COUNTS_SQL="select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::bigint as row_count from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name;"
docker exec ventylab-restore-test psql -U postgres -d restore_test -At -F ' ' -c "$COUNTS_SQL" > restored-counts.txt
psql "$BACKUP_DATABASE_URL" -At -F ' ' -c "$COUNTS_SQL" > source-counts.txt   # or: docker run --rm postgres:17-alpine psql ...
diff source-counts.txt restored-counts.txt && echo "restore test OK"

# 4. Migrations and triggers came back.
docker exec ventylab-restore-test psql -U postgres -d restore_test -c "select count(*) as applied, max(finished_at) as last from _prisma_migrations where rolled_back_at is null;"
docker exec ventylab-restore-test psql -U postgres -d restore_test -c "select event_object_table, trigger_name from information_schema.triggers where trigger_schema = 'public' order by 1, 2;"

# 5. Clean up.
docker rm -f ventylab-restore-test
rm -f source-counts.txt restored-counts.txt
```

Counts taken from a live source can differ slightly for tables written after the dump started (`audit_logs`, `ai_call_logs`, telemetry recordings); every other table must match exactly. Optionally point a local backend at the restored database (`DATABASE_URL`/`DIRECT_URL` to the container) and check `/health/ready`.
