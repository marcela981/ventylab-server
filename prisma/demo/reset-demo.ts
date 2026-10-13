/*
 * Funcionalidad: Reinicio de la base de demostración
 * Descripción: Restaura exactamente el estado de demostración tras pasar la guarda de seguridad: en una sola transacción trunca todas las tablas de negocio del esquema public (RESTART IDENTITY CASCADE; quedan fuera _prisma_migrations y audit_logs, que es de solo inserción y conserva su historial) y vuelve a ejecutar la semilla de demostración, incluidas las filas que siembran las migraciones (secciones y superadmin_email)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient } from "@prisma/client";

import { countBusinessTables, listBusinessTables, quoteIdentifier, type TableCounts } from "./demo-counts";
import { type DemoContext, type DemoDb } from "./demo-support";
import { createDemoContext, DEMO_TRANSACTION_OPTIONS, type DemoRunOptions, guardDemoOperation, seedDemoData } from "./seed-demo";

export async function resetDemo(prisma: PrismaClient, options: DemoRunOptions): Promise<TableCounts> {
  await guardDemoOperation(prisma, "reset", { ...options, initializeEmptyDatabase: false });

  const context: DemoContext = await createDemoContext(options);

  await prisma.$transaction(async (tx: DemoDb): Promise<void> => {
    const tables: string[] = await listBusinessTables(tx);

    await tx.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((table: string) => `public.${quoteIdentifier(table)}`).join(", ")} RESTART IDENTITY CASCADE`);
    await seedDemoData(tx, context);
  }, DEMO_TRANSACTION_OPTIONS);

  return await countBusinessTables(prisma);
}
