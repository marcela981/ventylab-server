/*
 * Funcionalidad: Mapeador de presentación de la calificación docente de evaluaciones
 * Descripción: Proyecta las vistas y resultados de calificación a DTOs: elementos de la cola, vista de calificación con escenarios y preguntas completos (reutiliza el mapeo de gestión con medios resueltos) y una entrada por pregunta con la respuesta, los puntajes, si está pendiente y el desglose práctico; resultados de calificar y publicar, y notas publicadas del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PracticalScoreResult } from "@/features/evaluation/application/ports/practical-score-provider.interface";
import {
  type EvaluationUserGrade,
  type GradeEvaluationAnswerResult,
  type GradingAttemptDetailResult,
  type PublishEvaluationAttemptGradeResult,
} from "@/features/evaluation/application/results/evaluation-grading.result";
import { type EvaluationQuestionItem, type EvaluationScenarioItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type EvaluationAnswerRecord } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type GradingQueueItemView } from "@/features/evaluation/domain/read-models/evaluation-grading.read-model";
import { earnedScore, hasPassedEvaluation } from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import {
  GradeEvaluationAnswerResponseDTO,
  GradingAnswerDTO,
  GradingAttemptDTO,
  GradingQueueItemDTO,
  GradingStudentDTO,
  MyEvaluationGradeDTO,
  PracticalScoreDTO,
  PublishAttemptGradeResponseDTO,
} from "@/features/evaluation/presentation/dtos/evaluation-grading.dto";
import { EvaluationsMapper } from "@/features/evaluation/presentation/mappers/evaluations.mapper";

export class EvaluationGradingMapper {
  public static toQueueItemDTO(view: GradingQueueItemView): GradingQueueItemDTO {
    return new GradingQueueItemDTO({
      attemptId: view.attemptId,
      evaluationId: view.evaluationId,
      evaluationTitle: view.evaluationTitle,
      evaluationType: view.evaluationType,
      assignmentId: view.assignmentId ?? null,
      attemptNumber: view.attemptNumber,
      student: new GradingStudentDTO({ id: view.student.id, name: view.student.name ?? null, email: view.student.email }),
      status: view.status,
      submittedAt: view.submittedAt ?? null,
      score: view.score ?? null,
      maxScore: view.maxScore ?? null,
      legacy: view.legacy,
    });
  }

  public static toAttemptDTO(result: GradingAttemptDetailResult): GradingAttemptDTO {
    const { attempt, evaluation, mediaUrls, practicalScores, passingGrade } = result;

    return new GradingAttemptDTO({
      id: attempt.id,
      evaluationId: evaluation.id,
      evaluationTitle: evaluation.title,
      evaluationType: evaluation.type,
      showResultsImmediately: evaluation.showResultsImmediately,
      assignmentId: attempt.assignmentId ?? null,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? null,
      score: attempt.score ?? null,
      maxScore: attempt.maxScore ?? null,
      grade: attempt.grade ?? null,
      passed: attempt.grade === undefined ? null : hasPassedEvaluation(attempt.grade, passingGrade),
      passingGrade,
      gradePublishedAt: attempt.gradePublishedAt ?? null,
      legacy: attempt.isLegacy,
      scenarios: evaluation.scenarios.map((scenario: EvaluationScenarioItem) => EvaluationsMapper.toScenarioDTO(scenario, mediaUrls)),
      questions: evaluation.questions.map((question: EvaluationQuestionItem) => EvaluationsMapper.toQuestionDTO(question, mediaUrls)),
      answers: evaluation.questions.map((question: EvaluationQuestionItem) =>
        EvaluationGradingMapper._toAnswerDTO(question.id, attempt.answerFor(question.id), practicalScores.get(question.id)),
      ),
    });
  }

  public static toGradeResponseDTO(result: GradeEvaluationAnswerResult): GradeEvaluationAnswerResponseDTO {
    return new GradeEvaluationAnswerResponseDTO({
      attemptId: result.attemptId,
      questionId: result.questionId,
      status: result.status,
      score: result.score ?? null,
      maxScore: result.maxScore ?? null,
      grade: result.grade ?? null,
      published: result.published,
      override: result.override,
    });
  }

  public static toPublishResponseDTO(result: PublishEvaluationAttemptGradeResult): PublishAttemptGradeResponseDTO {
    return new PublishAttemptGradeResponseDTO({ attemptId: result.attemptId, publishedAt: result.publishedAt, alreadyPublished: result.alreadyPublished });
  }

  public static toMyGradeDTO(grade: EvaluationUserGrade): MyEvaluationGradeDTO {
    return new MyEvaluationGradeDTO({
      attemptId: grade.attemptId,
      evaluationId: grade.evaluationId,
      evaluationTitle: grade.evaluationTitle,
      evaluationType: grade.evaluationType,
      attemptNumber: grade.attemptNumber,
      score: grade.score ?? null,
      maxScore: grade.maxScore ?? null,
      grade: grade.grade,
      passed: grade.passed,
      publishedAt: grade.publishedAt,
      legacy: grade.legacy,
    });
  }

  private static _toAnswerDTO(questionId: string, answer: EvaluationAnswerRecord | undefined, practical: PracticalScoreResult | undefined): GradingAnswerDTO {
    const earned: number | undefined = earnedScore(answer);

    return new GradingAnswerDTO({
      questionId,
      answerId: answer?.id ?? null,
      selectedOptionIds: [...(answer?.selectedOptionIds ?? [])],
      textAnswer: answer?.textAnswer ?? null,
      simulationSessionId: answer?.simulationSessionId ?? null,
      autoScore: answer?.autoScore ?? null,
      manualScore: answer?.manualScore ?? null,
      earnedScore: earned ?? null,
      pending: earned === undefined,
      teacherComment: answer?.teacherComment ?? null,
      gradedById: answer?.gradedById ?? null,
      practicalScore: practical ? EvaluationGradingMapper._toPracticalDTO(practical) : null,
    });
  }

  private static _toPracticalDTO(practical: PracticalScoreResult): PracticalScoreDTO {
    return practical.available
      ? new PracticalScoreDTO({ available: true, score: practical.score, breakdown: practical.breakdown, reason: null })
      : new PracticalScoreDTO({ available: false, score: null, breakdown: [], reason: practical.reason });
  }
}
