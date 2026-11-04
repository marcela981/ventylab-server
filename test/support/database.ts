/*
 * Funcionalidad: Base de datos de pruebas
 * Descripción: Crea clientes Prisma contra el contenedor local (tras verificar que la URL es local) y restablece la base de datos entre pruebas: primero espera a que ninguna otra conexión de la base tenga una consulta o transacción abierta (los suscriptores de eventos de la aplicación siguen escribiendo después de responder la petición HTTP y su bloqueo de filas contra el TRUNCATE producía 40P01 deadlock detected), luego, en una transacción con session_replication_role = replica (los disparadores ordinarios, como el append-only de audit_logs, no se ejecutan) trunca todas las tablas de aplicación con RESTART IDENTITY CASCADE en una sola sentencia y restaura las filas sembradas por las migraciones guardadas en test_baseline; si aun así PostgreSQL elige el restablecimiento como víctima de un interbloqueo, vuelve a esperar y lo reintenta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, PrismaClient } from "@prisma/client";

import { BASELINE_SCHEMA } from "./test-constants";
import { assertLocalTestEnvironment } from "./test-env";

interface TableRow {
  readonly tablename: string;
}

export function createTestPrismaClient(): PrismaClient {
  assertLocalTestEnvironment();

  return new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

async function listTables(prisma: PrismaClient, schema: string): Promise<string[]> {
  const rows: TableRow[] = await prisma.$queryRawUnsafe<TableRow[]>(
    "SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename <> '_prisma_migrations' ORDER BY tablename",
    schema,
  );

  return rows.map((row: TableRow): string => row.tablename);
}

// Domain event subscribers (grade feedback, notifications, progress...) are fire-and-forget: they keep writing after the
// HTTP response that triggered them, so the next test's reset can start while one of them holds row locks. TRUNCATE
// then waits for that transaction while the subscriber waits for a table TRUNCATE already locked: 40P01 deadlock.
const QUIESCENCE_POLL_MS: number = 25;
const QUIESCENCE_QUIET_POLLS: number = 3;
const QUIESCENCE_TIMEOUT_MS: number = 15_000;
const RESET_ATTEMPTS: number = 3;
const DEADLOCK_PATTERN: RegExp = /40P01|deadlock detected/;

interface BusyConnectionsRow {
  readonly busy: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve: () => void) => setTimeout(resolve, ms));
}

async function countBusyConnections(prisma: PrismaClient): Promise<number> {
  const rows: BusyConnectionsRow[] = await prisma.$queryRawUnsafe<BusyConnectionsRow[]>(
    `SELECT count(*)::int AS busy FROM pg_stat_activity
     WHERE datname = current_database() AND backend_type = 'client backend' AND pid <> pg_backend_pid()
       AND state IN ('active', 'idle in transaction', 'idle in transaction (aborted)')`,
  );

  return rows[0]?.busy ?? 0;
}

// Waits until no other connection has a query or transaction open for a few consecutive polls, so a chain of
// subscribers (one finishing, the next starting on setImmediate) is also drained. On timeout the reset proceeds anyway.
export async function waitForDatabaseQuiescence(prisma: PrismaClient, timeoutMs: number = QUIESCENCE_TIMEOUT_MS): Promise<void> {
  const deadline: number = Date.now() + timeoutMs;
  let quietPolls: number = 0;

  while (quietPolls < QUIESCENCE_QUIET_POLLS && Date.now() < deadline) {
    quietPolls = (await countBusyConnections(prisma)) === 0 ? quietPolls + 1 : 0;

    if (quietPolls < QUIESCENCE_QUIET_POLLS) {
      await sleep(QUIESCENCE_POLL_MS);
    }
  }
}

function isDeadlock(error: unknown): boolean {
  return error instanceof Error && DEADLOCK_PATTERN.test(error.message);
}

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables: string[] = await listTables(prisma, "public");
  const baseline: string[] = await listTables(prisma, BASELINE_SCHEMA);

  for (let attempt: number = 1; ; attempt += 1) {
    await waitForDatabaseQuiescence(prisma);

    try {
      await truncateAndRestoreBaseline(prisma, tables, baseline);

      return;
    } catch (error: unknown) {
      if (!isDeadlock(error) || attempt >= RESET_ATTEMPTS) {
        throw error;
      }
    }
  }
}

async function truncateAndRestoreBaseline(prisma: PrismaClient, tables: string[], baseline: string[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<void> => {
    await tx.$executeRawUnsafe("SET LOCAL session_replication_role = replica");
    await tx.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((table: string): string => `public.${quoteIdentifier(table)}`).join(", ")} RESTART IDENTITY CASCADE`);

    for (const table of baseline) {
      await tx.$executeRawUnsafe(`INSERT INTO public.${quoteIdentifier(table)} SELECT * FROM ${quoteIdentifier(BASELINE_SCHEMA)}.${quoteIdentifier(table)}`);
    }
  });
}
