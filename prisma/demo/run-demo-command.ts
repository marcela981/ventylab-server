/*
 * Funcionalidad: Ejecución por consola de la semilla y el reinicio de demostración
 * Descripción: Punto de entrada de los scripts demo:seed y demo:reset: crea el cliente Prisma (que carga DATABASE_URL), arma las opciones desde NODE_ENV, DATABASE_URL, SUPERADMIN_EMAIL y la bandera --init-empty, ejecuta la operación pedida, imprime la tabla de filas por tabla de negocio y termina con código 1 y un mensaje claro si la guarda la rechaza o algo falla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { PrismaClient } from "@prisma/client";

import { formatCountsTable, type TableCounts } from "./demo-counts";
import { DemoGuardError, type DemoOperation } from "./demo-guard";
import { DEMO_PASSWORD } from "./demo-support";
import { resetDemo } from "./reset-demo";
import { type DemoRunOptions, seedDemo } from "./seed-demo";

const INIT_EMPTY_FLAG: string = "--init-empty";

function readOperation(argv: readonly string[]): DemoOperation {
  const operation: string | undefined = argv.find((arg: string): boolean => arg === "seed" || arg === "reset");

  if (operation !== "seed" && operation !== "reset") {
    throw new Error("Usage: tsx prisma/demo/run-demo-command.ts <seed|reset> [--init-empty]");
  }

  return operation;
}

async function main(argv: readonly string[]): Promise<void> {
  const operation: DemoOperation = readOperation(argv);
  const prisma: PrismaClient = new PrismaClient();

  const options: DemoRunOptions = {
    environment: { nodeEnv: process.env.NODE_ENV, databaseUrl: process.env.DATABASE_URL },
    superadminEmail: process.env.SUPERADMIN_EMAIL,
    initializeEmptyDatabase: argv.includes(INIT_EMPTY_FLAG),
  };

  try {
    const startedAt: number = Date.now();
    const counts: TableCounts = operation === "seed" ? await seedDemo(prisma, options) : await resetDemo(prisma, options);

    console.log(`Demo ${operation} finished in ${Date.now() - startedAt} ms. Demo password for every seeded account: ${DEMO_PASSWORD}`);
    console.log("Rows per business table (audit_logs is append-only and excluded):");
    console.log(formatCountsTable(counts));
  } finally {
    await prisma.$disconnect();
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof DemoGuardError ? error.message : error);
  process.exit(1);
});
