/*
 * Funcionalidad: Reordenamiento por lotes en SQL
 * Descripción: Aplica un plan de reordenamiento con dos sentencias UPDATE ... FROM (VALUES ...) dentro de la transacción recibida; la primera fase usa órdenes negativos temporales para no violar las restricciones únicas (moduleId, order) y (pageId, order)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma } from "@prisma/client";

import { type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";

export type ReorderableTable = "sections" | "levels" | "modules" | "lessons" | "pages" | "page_sections" | "steps";

const UPDATED_AT_COLUMNS: Readonly<Record<ReorderableTable, string>> = {
  sections: "updated_at",
  levels: "updatedAt",
  modules: "updatedAt",
  lessons: "updatedAt",
  pages: "updatedAt",
  page_sections: "updatedAt",
  steps: "updatedAt",
};

export async function applyReorder(client: PrismaExecutor, table: ReorderableTable, entries: ReadonlyArray<ReorderEntry>): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const tableName: Prisma.Sql = Prisma.raw(`"${table}"`);
  const updatedAtColumn: Prisma.Sql = Prisma.raw(`"${UPDATED_AT_COLUMNS[table]}"`);
  const values: Prisma.Sql = Prisma.join(entries.map((entry: ReorderEntry) => Prisma.sql`(${entry.id}, ${entry.order}::int)`));

  await client.$executeRaw`
    UPDATE ${tableName} AS target
    SET "order" = -(source.new_order + 1)
    FROM (VALUES ${values}) AS source(id, new_order)
    WHERE target.id = source.id
  `;

  await client.$executeRaw`
    UPDATE ${tableName} AS target
    SET "order" = source.new_order, ${updatedAtColumn} = NOW()
    FROM (VALUES ${values}) AS source(id, new_order)
    WHERE target.id = source.id
  `;
}
