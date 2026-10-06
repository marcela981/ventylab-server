/*
 * Funcionalidad: Mapeador de persistencia de GradeFeedback
 * Descripción: Convierte filas grade_feedbacks de Prisma en GradeFeedbackRecord (null a undefined) y registros en entradas createMany (undefined a null)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedback as GradeFeedbackModel, type Prisma } from "@prisma/client";

import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";

export class GradeFeedbacksMapper {
  public static toRecord(row: GradeFeedbackModel): GradeFeedbackRecord {
    return {
      id: row.id,
      attemptId: row.attemptId,
      questionId: row.questionId ?? undefined,
      content: row.content,
      source: row.source,
      provider: row.provider ?? undefined,
      model: row.model ?? undefined,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  public static toPersistence(record: GradeFeedbackRecord): Prisma.GradeFeedbackCreateManyInput {
    return {
      id: record.id,
      attemptId: record.attemptId,
      questionId: record.questionId ?? null,
      content: record.content,
      source: record.source,
      provider: record.provider ?? null,
      model: record.model ?? null,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
