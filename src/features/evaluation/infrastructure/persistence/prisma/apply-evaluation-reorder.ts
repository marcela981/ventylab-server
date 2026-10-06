/*
 * Funcionalidad: Reordenamiento por lotes de evaluaciones
 * Descripción: Aplica en una sola sentencia UPDATE ... FROM (VALUES ...) el nuevo orden de preguntas (con su posible cambio de escenario), escenarios u opciones, acotado a la evaluación o pregunta dueña y sobre el cliente de la transacción activa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma } from "@prisma/client";

import { type PrismaExecutor } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { type OrderEntry, type QuestionOrderEntry } from "@/features/evaluation/domain/entities/evaluation-items";

export async function applyQuestionOrder(client: PrismaExecutor, evaluationId: string, entries: ReadonlyArray<QuestionOrderEntry>): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const values: Prisma.Sql = Prisma.join(
    entries.map(
      (entry: QuestionOrderEntry) => Prisma.sql`(${entry.id}, ${entry.order}::int, ${entry.setScenario}::boolean, ${entry.scenarioId ?? null}::text)`,
    ),
  );

  await client.$executeRaw`
    UPDATE "evaluation_questions" AS target
    SET "order" = source.new_order,
        "scenario_id" = CASE WHEN source.set_scenario THEN source.scenario_id ELSE target."scenario_id" END,
        "updated_at" = NOW()
    FROM (VALUES ${values}) AS source(id, new_order, set_scenario, scenario_id)
    WHERE target.id = source.id AND target."evaluation_id" = ${evaluationId}
  `;
}

export async function applyScenarioOrder(client: PrismaExecutor, evaluationId: string, entries: ReadonlyArray<OrderEntry>): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const values: Prisma.Sql = Prisma.join(entries.map((entry: OrderEntry) => Prisma.sql`(${entry.id}, ${entry.order}::int)`));

  await client.$executeRaw`
    UPDATE "evaluation_scenarios" AS target
    SET "order" = source.new_order, "updated_at" = NOW()
    FROM (VALUES ${values}) AS source(id, new_order)
    WHERE target.id = source.id AND target."evaluation_id" = ${evaluationId}
  `;
}

export async function applyOptionOrder(client: PrismaExecutor, questionId: string, entries: ReadonlyArray<OrderEntry>): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const values: Prisma.Sql = Prisma.join(entries.map((entry: OrderEntry) => Prisma.sql`(${entry.id}, ${entry.order}::int)`));

  await client.$executeRaw`
    UPDATE "evaluation_question_options" AS target
    SET "order" = source.new_order
    FROM (VALUES ${values}) AS source(id, new_order)
    WHERE target.id = source.id AND target."question_id" = ${questionId}
  `;
}
