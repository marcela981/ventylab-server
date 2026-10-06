/*
 * Funcionalidad: Mapeador de respuesta de asignaciones de evaluación
 * Descripción: Convierte el resultado de una asignación con estado derivado en su DTO de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAssignmentResult } from "@/features/evaluation/application/results/evaluation-assignment.result";
import { EvaluationAssignmentAttemptCountsDTO, EvaluationAssignmentDTO } from "@/features/evaluation/presentation/dtos/evaluation-assignment.dto";

export class EvaluationAssignmentsMapper {
  public static toDTO(result: EvaluationAssignmentResult): EvaluationAssignmentDTO {
    return new EvaluationAssignmentDTO({
      id: result.id,
      evaluationId: result.evaluationId,
      evaluationTitle: result.evaluationTitle,
      evaluationType: result.evaluationType,
      evaluationStatus: result.evaluationStatus,
      groupId: result.groupId,
      groupName: result.groupName,
      startsAt: result.startsAt,
      endsAt: result.endsAt ?? null,
      state: result.state,
      assignedById: result.assignedById ?? null,
      legacyIsActive: result.legacyIsActive ?? null,
      attemptCounts: new EvaluationAssignmentAttemptCountsDTO(result.attemptCounts),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  }
}
