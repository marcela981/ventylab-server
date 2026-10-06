/*
 * Funcionalidad: Mapeador Prisma de asignaciones de evaluación
 * Descripción: Convierte filas de evaluation_assignments en el agregado EvaluationAssignment y viceversa, y arma la vista de lectura con evaluación, grupo y conteos de intentos por estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignment as EvaluationAssignmentModel, type EvaluationStatus, type EvaluationType, type Prisma } from "@prisma/client";

import { EvaluationAssignment } from "@/features/evaluation/domain/entities/evaluation-assignment.entity";
import {
  type EvaluationAssignmentAttemptCounts,
  type EvaluationAssignmentView,
} from "@/features/evaluation/domain/read-models/evaluation-assignment.read-model";

export const EVALUATION_ASSIGNMENT_VIEW_INCLUDE: {
  evaluation: { select: { title: true; type: true; status: true } };
  group: { select: { name: true } };
} = {
  evaluation: { select: { title: true, type: true, status: true } },
  group: { select: { name: true } },
};

export type EvaluationAssignmentViewRow = EvaluationAssignmentModel & {
  evaluation: { title: string; type: EvaluationType; status: EvaluationStatus };
  group: { name: string };
};

export const EMPTY_ATTEMPT_COUNTS: EvaluationAssignmentAttemptCounts = { inProgress: 0, submitted: 0, pendingReview: 0, graded: 0 };

export class EvaluationAssignmentsMapper {
  public static toDomain(row: EvaluationAssignmentModel): EvaluationAssignment {
    return EvaluationAssignment.reconstitute({
      id: row.id,
      evaluationId: row.evaluationId,
      groupId: row.groupId,
      startsAt: row.startsAt,
      endsAt: row.endsAt ?? undefined,
      assignedById: row.assignedById ?? undefined,
      legacyIsActive: row.legacyIsActive ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toPersistence(assignment: EvaluationAssignment): Prisma.EvaluationAssignmentUncheckedCreateInput {
    return {
      id: assignment.id,
      evaluationId: assignment.evaluationId,
      groupId: assignment.groupId,
      startsAt: assignment.startsAt,
      endsAt: assignment.endsAt ?? null,
      assignedById: assignment.assignedById ?? null,
      legacyIsActive: assignment.legacyIsActive ?? null,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }

  public static toView(row: EvaluationAssignmentViewRow, attemptCounts: EvaluationAssignmentAttemptCounts | undefined): EvaluationAssignmentView {
    return {
      id: row.id,
      evaluationId: row.evaluationId,
      evaluationTitle: row.evaluation.title,
      evaluationType: row.evaluation.type,
      evaluationStatus: row.evaluation.status,
      groupId: row.groupId,
      groupName: row.group.name,
      startsAt: row.startsAt,
      endsAt: row.endsAt ?? undefined,
      assignedById: row.assignedById ?? undefined,
      legacyIsActive: row.legacyIsActive ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attemptCounts: attemptCounts ?? EMPTY_ATTEMPT_COUNTS,
    };
  }
}
