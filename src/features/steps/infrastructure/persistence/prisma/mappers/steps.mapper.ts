/*
 * Funcionalidad: Mapeador de persistencia StepsMapper
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de pasos (tarjetas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type Step as StepModel } from "@prisma/client";

import { Step } from "@/features/steps/domain/entities/step.entity";
import { type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";

export class StepsMapper {
  public static toDomain(row: StepModel): Step {
    return Step.reconstitute({
      id: row.id,
      lessonId: row.lessonId,
      title: row.title ?? undefined,
      content: row.content,
      contentType: row.contentType,
      order: row.order,
      isActive: row.isActive,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(step: Step): Prisma.StepUncheckedCreateInput {
    return {
      id: step.id,
      lessonId: step.lessonId,
      title: step.title ?? null,
      content: step.content,
      contentType: step.contentType,
      order: step.order,
      isActive: step.isActive,
      lastModifiedBy: step.lastModifiedBy ?? null,
      lastModifiedAt: step.lastModifiedAt ?? null,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    };
  }

  public static toSummary(row: StepModel): StepSummary {
    return {
      id: row.id,
      lessonId: row.lessonId,
      title: row.title ?? undefined,
      content: row.content,
      contentType: row.contentType,
      order: row.order,
      isActive: row.isActive,
      lastModifiedBy: row.lastModifiedBy ?? undefined,
      lastModifiedAt: row.lastModifiedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
