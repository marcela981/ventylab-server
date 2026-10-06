/*
 * Funcionalidad: Mapeador de retroalimentación de calificación
 * Descripción: Convierte los resultados de retroalimentación en DTOs: para el estudiante solo id de la fila (objetivo de la valoración), estado, y contenido y origen cuando la fila está READY (nunca proveedor ni modelo); para el docente además proveedor, modelo y fecha; y la aceptación de una regeneración
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackRegenerationResult, type GradeFeedbackResult } from "@/features/evaluation/application/results/grade-feedback.result";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { READY_FEEDBACK_STATUS } from "@/features/evaluation/domain/value-objects/grade-feedback-status";
import {
  GradeFeedbackDTO,
  GradeFeedbackItemDTO,
  GradeFeedbackRegenerationDTO,
  StudentGradeFeedbackDTO,
  StudentGradeFeedbackItemDTO,
} from "@/features/evaluation/presentation/dtos/grade-feedback.dto";

export class GradeFeedbacksMapper {
  public static toStudentDTO(result: GradeFeedbackResult): StudentGradeFeedbackDTO {
    return new StudentGradeFeedbackDTO({
      attemptId: result.attemptId,
      overall: result.overall ? GradeFeedbacksMapper.toStudentItemDTO(result.overall) : null,
      questions: result.questions.map((record: GradeFeedbackRecord) => GradeFeedbacksMapper.toStudentItemDTO(record)),
    });
  }

  public static toTeacherDTO(result: GradeFeedbackResult): GradeFeedbackDTO {
    return new GradeFeedbackDTO({
      attemptId: result.attemptId,
      overall: result.overall ? GradeFeedbacksMapper.toTeacherItemDTO(result.overall) : null,
      questions: result.questions.map((record: GradeFeedbackRecord) => GradeFeedbacksMapper.toTeacherItemDTO(record)),
    });
  }

  public static toRegenerationDTO(result: GradeFeedbackRegenerationResult): GradeFeedbackRegenerationDTO {
    return new GradeFeedbackRegenerationDTO({ attemptId: result.attemptId, status: result.status });
  }

  private static toStudentItemDTO(record: GradeFeedbackRecord): StudentGradeFeedbackItemDTO {
    const ready: boolean = record.status === READY_FEEDBACK_STATUS;

    return new StudentGradeFeedbackItemDTO({
      id: record.id,
      questionId: record.questionId ?? null,
      status: record.status,
      source: ready ? record.source : null,
      content: ready ? record.content : null,
    });
  }

  private static toTeacherItemDTO(record: GradeFeedbackRecord): GradeFeedbackItemDTO {
    return new GradeFeedbackItemDTO({
      id: record.id,
      questionId: record.questionId ?? null,
      status: record.status,
      source: record.status === READY_FEEDBACK_STATUS ? record.source : null,
      provider: record.provider ?? null,
      model: record.model ?? null,
      content: record.content,
      updatedAt: record.updatedAt,
    });
  }
}
