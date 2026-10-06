/*
 * Funcionalidad: Mapeador de presentación de evaluaciones
 * Descripción: Proyecta los resultados de lectura de evaluaciones (listado y detalle de gestión) a DTOs de respuesta, adjuntando las URLs firmadas ya resueltas de los medios y leyendo la descripción como texto o documento Tiptap
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type EvaluationDetailResult, type EvaluationListItemResult } from "@/features/evaluation/application/results/evaluation-detail.result";
import {
  type EvaluationOptionItem,
  type EvaluationQuestionItem,
  type EvaluationScenarioItem,
} from "@/features/evaluation/domain/entities/evaluation-items";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationReadinessIssue } from "@/features/evaluation/domain/services/evaluation-readiness";
import { readEvaluationDescription } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";
import {
  EvaluationDetailDTO,
  EvaluationMediaDTO,
  EvaluationOptionDTO,
  EvaluationQuestionDTO,
  EvaluationReadinessIssueDTO,
  EvaluationScenarioDTO,
  EvaluationSummaryDTO,
  EvaluationUsageDTO,
} from "@/features/evaluation/presentation/dtos/evaluation.dto";

export type MediaLookup = ReadonlyMap<string, ResolvedMediaURL>;

export class EvaluationsMapper {
  public static toSummaryDTO(item: EvaluationListItemResult): EvaluationSummaryDTO {
    const { summary } = item;

    return new EvaluationSummaryDTO({
      id: summary.id,
      type: summary.type,
      title: summary.title,
      status: summary.status,
      moduleId: summary.moduleId ?? null,
      levelId: summary.levelId ?? null,
      lessonId: summary.lessonId ?? null,
      durationMinutes: summary.durationMinutes ?? null,
      maxAttempts: summary.maxAttempts,
      showResultsImmediately: summary.showResultsImmediately,
      createdById: summary.createdById ?? null,
      createdByName: summary.createdByName ?? null,
      legacySource: summary.legacySource ?? null,
      questionCount: summary.questionCount,
      scenarioCount: summary.scenarioCount,
      assignmentCount: summary.assignmentCount,
      canManage: item.canManage,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    });
  }

  public static toDetailDTO(result: EvaluationDetailResult): EvaluationDetailDTO {
    const evaluation: Evaluation = result.evaluation;
    const media: MediaLookup = result.mediaUrls;

    return new EvaluationDetailDTO({
      id: evaluation.id,
      type: evaluation.type,
      title: evaluation.title,
      description: evaluation.description === undefined ? null : readEvaluationDescription(evaluation.description),
      status: evaluation.status,
      moduleId: evaluation.moduleId ?? null,
      levelId: evaluation.levelId ?? null,
      lessonId: evaluation.lessonId ?? null,
      durationMinutes: evaluation.durationMinutes ?? null,
      maxAttempts: evaluation.maxAttempts,
      shuffleQuestions: evaluation.shuffleQuestions,
      showResultsImmediately: evaluation.showResultsImmediately,
      order: evaluation.order,
      createdById: evaluation.createdById ?? null,
      legacySource: evaluation.legacy.source ?? null,
      legacyType: evaluation.legacy.type ?? null,
      scenarios: evaluation.scenarios.map((scenario: EvaluationScenarioItem) => EvaluationsMapper.toScenarioDTO(scenario, media)),
      questions: evaluation.questions.map((question: EvaluationQuestionItem) => EvaluationsMapper.toQuestionDTO(question, media)),
      usage: new EvaluationUsageDTO({ ...result.usage }),
      structureLocked: result.usage.submittedAttempts > 0,
      readinessIssues: result.readinessIssues.map(
        (issue: EvaluationReadinessIssue) =>
          new EvaluationReadinessIssueDTO({ code: issue.code, questionId: issue.questionId ?? null, details: issue.details ?? [] }),
      ),
      canManage: result.canManage,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
    });
  }

  private static _toMediaDTO(resolved: ResolvedMediaURL): EvaluationMediaDTO {
    return new EvaluationMediaDTO({
      mediaId: resolved.mediaId,
      url: resolved.url,
      mimeType: resolved.mimeType,
      kind: resolved.kind,
      expiresAt: resolved.expiresAt ?? null,
    });
  }

  private static _toMediaList(mediaIds: ReadonlyArray<string>, media: MediaLookup): EvaluationMediaDTO[] {
    return mediaIds.flatMap((id: string) => {
      const resolved: ResolvedMediaURL | undefined = media.get(id);

      return resolved ? [EvaluationsMapper._toMediaDTO(resolved)] : [];
    });
  }

  public static toScenarioDTO(scenario: EvaluationScenarioItem, media: MediaLookup): EvaluationScenarioDTO {
    return new EvaluationScenarioDTO({
      id: scenario.id,
      order: scenario.order,
      content: scenario.content,
      mediaIds: [...scenario.mediaIds],
      media: EvaluationsMapper._toMediaList(scenario.mediaIds, media),
    });
  }

  public static toQuestionDTO(question: EvaluationQuestionItem, media: MediaLookup): EvaluationQuestionDTO {
    return new EvaluationQuestionDTO({
      id: question.id,
      scenarioId: question.scenarioId ?? null,
      order: question.order,
      type: question.type,
      prompt: question.prompt,
      mediaIds: [...question.mediaIds],
      media: EvaluationsMapper._toMediaList(question.mediaIds, media),
      points: question.points,
      explanation: question.explanation ?? null,
      clinicalCaseId: question.clinicalCaseId ?? null,
      rubric: question.rubric ?? null,
      options: question.options.map((option: EvaluationOptionItem) => EvaluationsMapper._toOptionDTO(option, media)),
    });
  }

  private static _toOptionDTO(option: EvaluationOptionItem, media: MediaLookup): EvaluationOptionDTO {
    const resolved: ResolvedMediaURL | undefined = option.mediaId ? media.get(option.mediaId) : undefined;

    return new EvaluationOptionDTO({
      id: option.id,
      order: option.order,
      content: option.content,
      isCorrect: option.isCorrect,
      mediaId: option.mediaId ?? null,
      media: resolved ? EvaluationsMapper._toMediaDTO(resolved) : null,
      feedback: option.legacyFeedback ?? null,
    });
  }
}
