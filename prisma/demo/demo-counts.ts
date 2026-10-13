/*
 * Funcionalidad: Conteo de tablas de negocio de la demostración
 * Descripción: Lista las tablas de negocio del esquema public (todas salvo _prisma_migrations y audit_logs, que es de solo inserción y el reinicio no toca), cuenta sus filas y las imprime como tabla; el conteo permite comparar dos reinicios consecutivos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DemoDb } from "./demo-support";

const NON_BUSINESS_TABLES: readonly string[] = ["_prisma_migrations", "audit_logs"];

export type TableCounts = Readonly<Record<string, number>>;

export function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

export async function listBusinessTables(db: DemoDb): Promise<string[]> {
  const rows: { tablename: string }[] = await db.$queryRawUnsafe<{ tablename: string }[]>("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");

  return rows.map((row: { tablename: string }) => row.tablename).filter((table: string): boolean => !NON_BUSINESS_TABLES.includes(table));
}

export async function countBusinessTables(db: DemoDb): Promise<TableCounts> {
  const counts: Record<string, number> = {};

  for (const table of await listBusinessTables(db)) {
    const rows: { count: number }[] = await db.$queryRawUnsafe<{ count: number }[]>(`SELECT count(*)::int AS count FROM public.${quoteIdentifier(table)}`);

    counts[table] = rows[0]?.count ?? 0;
  }

  return counts;
}

export function formatCountsTable(counts: TableCounts): string {
  const tables: string[] = Object.keys(counts).sort();
  const width: number = Math.max("table".length, ...tables.map((table: string) => table.length));
  const total: number = tables.reduce((sum: number, table: string) => sum + (counts[table] ?? 0), 0);

  const lines: string[] = [
    `${"table".padEnd(width)} | rows`,
    `${"-".repeat(width)}-|------`,
    ...tables.map((table: string) => `${table.padEnd(width)} | ${String(counts[table] ?? 0).padStart(5)}`),
    `${"-".repeat(width)}-|------`,
    `${"total".padEnd(width)} | ${String(total).padStart(5)}`,
  ];

  return lines.join("\n");
}
