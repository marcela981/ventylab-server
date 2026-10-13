/*
 * Funcionalidad: Semilla de demostración
 * Descripción: Orquesta la semilla idempotente de la base de demostración (identidades y marcador, contenido publicado, casos clínicos, evaluaciones con intentos y notas, reservas, sesiones de simulación, historial de aprendizaje y de IA, notificaciones) dentro de una sola transacción, tras pasar la guarda de seguridad; todas las filas se insertan o actualizan por IDs deterministas y sus fechas se calculan desde el inicio del día UTC de la ejecución
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient } from "@prisma/client";

import { seedAiHistory } from "./data/ai-history";
import { seedClinicalCases } from "./data/clinical-cases";
import { seedContent } from "./data/content";
import { type SeededEvaluations, seedEvaluations } from "./data/evaluations";
import { seedIdentity } from "./data/identity";
import { seedLearningHistory } from "./data/learning-history";
import { seedNotifications } from "./data/notifications";
import { type DisplacedReservation, seedReservations } from "./data/reservations";
import { seedSimulationSessions } from "./data/simulation";
import { countBusinessTables, type TableCounts } from "./demo-counts";
import { assertDemoOperationAllowed, type DemoEnvironment, type DemoOperation, readDemoDatabaseState } from "./demo-guard";
import { createDemoClock, DEFAULT_DEMO_SUPERADMIN_EMAIL, type DemoContext, type DemoDb, demoPasswordHash } from "./demo-support";

export interface DemoRunOptions {
  readonly environment: DemoEnvironment;
  readonly superadminEmail?: string;
  readonly now?: Date;
  readonly initializeEmptyDatabase?: boolean;
}

export const DEMO_TRANSACTION_OPTIONS: { readonly maxWait: number; readonly timeout: number } = { maxWait: 10_000, timeout: 300_000 };

export async function createDemoContext(options: DemoRunOptions): Promise<DemoContext> {
  const email: string = options.superadminEmail?.trim() ?? "";

  return {
    clock: createDemoClock(options.now ?? new Date()),
    superadminEmail: (email.length > 0 ? email : DEFAULT_DEMO_SUPERADMIN_EMAIL).toLowerCase(),
    passwordHash: await demoPasswordHash(),
  };
}

export async function guardDemoOperation(prisma: PrismaClient, operation: DemoOperation, options: DemoRunOptions): Promise<void> {
  assertDemoOperationAllowed({
    operation,
    environment: options.environment,
    database: await readDemoDatabaseState(prisma),
    initializeEmptyDatabase: options.initializeEmptyDatabase,
  });
}

export async function seedDemoData(db: DemoDb, context: DemoContext): Promise<void> {
  await seedIdentity(db, context);
  await seedContent(db, context);
  await seedClinicalCases(db, context);

  const seeded: SeededEvaluations = await seedEvaluations(db, context);
  const displacedReservations: DisplacedReservation[] = await seedReservations(db, context);

  await seedSimulationSessions(db, context);
  await seedLearningHistory(db, context);
  await seedAiHistory(db, context, seeded.publishedAttempts);
  await seedNotifications(db, context, { evaluations: seeded.evaluations, publishedAttempts: seeded.publishedAttempts, displacedReservations });
}

export async function seedDemo(prisma: PrismaClient, options: DemoRunOptions): Promise<TableCounts> {
  await guardDemoOperation(prisma, "seed", options);

  const context: DemoContext = await createDemoContext(options);

  await prisma.$transaction((tx: DemoDb) => seedDemoData(tx, context), DEMO_TRANSACTION_OPTIONS);

  return await countBusinessTables(prisma);
}
