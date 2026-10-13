/*
 * Funcionalidad: Base de datos de pruebas
 * Descripción: Crea clientes Prisma contra el contenedor local (tras verificar que la URL es local) y restablece la base de datos entre pruebas: en una transacción con session_replication_role = replica (los disparadores ordinarios, como el append-only de audit_logs, no se ejecutan) trunca todas las tablas de aplicación con RESTART IDENTITY CASCADE en una sola sentencia y restaura las filas sembradas por las migraciones guardadas en test_baseline
 * Versión: 1.0
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

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables: string[] = await listTables(prisma, "public");
  const baseline: string[] = await listTables(prisma, BASELINE_SCHEMA);

  await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<void> => {
    await tx.$executeRawUnsafe("SET LOCAL session_replication_role = replica");
    await tx.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((table: string): string => `public.${quoteIdentifier(table)}`).join(", ")} RESTART IDENTITY CASCADE`);

    for (const table of baseline) {
      await tx.$executeRawUnsafe(`INSERT INTO public.${quoteIdentifier(table)} SELECT * FROM ${quoteIdentifier(BASELINE_SCHEMA)}.${quoteIdentifier(table)}`);
    }
  });
}
