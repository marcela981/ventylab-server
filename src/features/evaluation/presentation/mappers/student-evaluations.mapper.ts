/*
 * Funcionalidad: Mapeador de respuestas de evaluaciones del estudiante
 * Descripción: Convierte los resultados de los casos de uso del estudiante a sus DTOs propios: inicio de intento, detalle del intento (oculta isCorrect, explicación, rúbrica, retroalimentación de opciones, puntajes y nota hasta que la nota se publica; luego los incluye con el puntaje por pregunta; la nota parcial de las preguntas cerradas solo en intentos PENDING_REVIEW de QUIZ y WORKSHOP), entrega y listado de evaluaciones asignadas con sus intentos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import {
  type CheckEvaluationAnswerResult,
  type StartEvaluationAttemptResult,
  type StudentEvaluationAttemptDetailResult,
  type StudentEvaluationListItemResult,
  type SubmitEvaluationAttemptResult,
} from "@/features/evaluation/application/results/student-evaluation-attempt.result";
import {
  type EvaluationOptionItem,
  type EvaluationQuestionItem,
  type EvaluationScenarioItem,
} from "@/features/evaluation/domain/entities/evaluation-items";
import { type EvaluationAnswerRecord, type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type StudentAttemptSummaryView } from "@/features/evaluation/domain/read-models/student-evaluation.read-model";
import {
  computePartialClosedScore,
  correctOptionIds,
  hasPassedEvaluation,
  isChoiceAnswerCorrect,
} from "@/features/evaluation/domain/services/evaluation-attempt-grader";
import { ACTIVE_ASSIGNMENT_STATE } from "@/features/evaluation/domain/value-objects/evaluation-assignment-state";
import { IN_PROGRESS_ATTEMPT_STATUS, PENDING_REVIEW_ATTEMPT_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-attempt-status";
import { readEvaluationDescription } from "@/features/evaluation/domain/value-objects/evaluation-rich-text";
import { type EvaluationTypeValue, immediateFeedbackFor, WORKSHOP_EVALUATION_TYPE } from "@/features/evaluation/domain/value-objects/evaluation-type";
import { EvaluationMediaDTO } from "@/features/evaluation/presentation/dtos/evaluation.dto";
import {
  CheckEvaluationAnswerResponseDTO,
  MyEvaluationAttemptDTO,
  MyEvaluationDTO,
  MyEvaluationSummaryDTO,
  PartialClosedScoreDTO,
  type PublishedGradeFields,
  StudentAnswerDTO,
  StudentAttemptDetailDTO,
  StudentAttemptEvaluationDTO,
  StudentAnswerRevealDTO,
  StudentAttemptStartDTO,
  StudentOptionDTO,
  StudentQuestionDTO,
  StudentScenarioDTO,
  SubmitEvaluationAttemptResponseDTO,
} from "@/features/evaluation/presentation/dtos/student-evaluation.dto";

type MediaLookup = ReadonlyMap<string, ResolvedMediaURL>;

function gradeFields(grade: number | undefined, score: number | undefined, maxScore: number | undefined, passingGrade: number): PublishedGradeFields {
  return { score, maxScore, grade, passed: grade === undefined ? undefined : hasPassedEvaluation(grade, passingGrade) };
}

export class StudentEvaluationsMapper {
  public static toStartDTO(result: StartEvaluationAttemptResult): StudentAttemptStartDTO {
    const attempt: StudentEvaluationAttempt = result.attempt;

    return new StudentAttemptStartDTO({
      id: attempt.id,
      evaluationId: attempt.evaluationId,
      assignmentId: attempt.assignmentId ?? null,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: result.deadlineAt ?? null,
      serverNow: result.now,
      created: result.created,
    });
  }

  public static toAttemptDetailDTO(result: StudentEvaluationAttemptDetailResult): StudentAttemptDetailDTO {
    const { attempt, evaluation, mediaUrls } = result;
    const published: boolean = attempt.isPublished;

    return new StudentAttemptDetailDTO({
      id: attempt.id,
      assignmentId: attempt.assignmentId ?? null,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? null,
      deadlineAt: result.deadlineAt ?? null,
      serverNow: result.now,
      published,
      grade: gradeFields(attempt.grade, attempt.score, attempt.maxScore, result.passingGrade),
      partialClosedScore: StudentEvaluationsMapper._toPartialClosedScore(result),
      evaluation: new StudentAttemptEvaluationDTO({
        id: evaluation.id,
        title: evaluation.title,
        type: evaluation.type,
        description: evaluation.description === undefined ? null : readEvaluationDescription(evaluation.description),
      }),
      scenarios: evaluation.scenarios.map(
        (scenario: EvaluationScenarioItem) =>
          new StudentScenarioDTO({
            id: scenario.id,
            order: scenario.order,
            content: scenario.content,
            media: StudentEvaluationsMapper._toMediaList(scenario.mediaIds, mediaUrls),
          }),
      ),
      questions: result.questions.map((question: EvaluationQuestionItem, position: number) =>
        StudentEvaluationsMapper._toQuestionDTO(question, position, attempt.answerFor(question.id), { published, evaluationType: evaluation.type }, mediaUrls),
      ),
    });
  }

  public static toCheckDTO(result: CheckEvaluationAnswerResult): CheckEvaluationAnswerResponseDTO {
    return new CheckEvaluationAnswerResponseDTO({
      isCorrect: result.isCorrect,
      correctOptionIds: [...result.correctOptionIds],
      explanation: result.explanation ?? null,
    });
  }

  public static toSubmitDTO(result: SubmitEvaluationAttemptResult): SubmitEvaluationAttemptResponseDTO {
    return new SubmitEvaluationAttemptResponseDTO({
      attemptId: result.attemptId,
      status: result.status,
      submittedAt: result.submittedAt ?? null,
      published: result.published,
      grade: { score: result.score, maxScore: result.maxScore, grade: result.grade, passed: result.passed },
    });
  }

  public static toMyEvaluationDTO(item: StudentEvaluationListItemResult): MyEvaluationDTO {
    const attempts: MyEvaluationAttemptDTO[] = item.attempts.map((attempt: StudentAttemptSummaryView) => {
      const published: boolean = attempt.gradePublishedAt !== undefined;

      return new MyEvaluationAttemptDTO({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt ?? null,
        deadlineAt: attempt.deadlineAt ?? null,
        published,
        grade: gradeFields(attempt.grade, attempt.score, attempt.maxScore, item.passingGrade),
      });
    });

    const hasOpenAttempt: boolean = item.attempts.some((attempt: StudentAttemptSummaryView) => attempt.status === IN_PROGRESS_ATTEMPT_STATUS);
    const maxAttempts: number = item.evaluation?.maxAttempts ?? 0;

    return new MyEvaluationDTO({
      assignmentId: item.assignment.id,
      state: item.assignment.state,
      startsAt: item.assignment.startsAt,
      endsAt: item.assignment.endsAt ?? null,
      evaluation: item.evaluation
        ? new MyEvaluationSummaryDTO({
          id: item.evaluation.id,
          title: item.evaluation.title,
          type: item.evaluation.type,
          description: item.evaluation.description === undefined ? null : readEvaluationDescription(item.evaluation.description),
          durationMinutes: item.evaluation.durationMinutes ?? null,
          maxAttempts: item.evaluation.maxAttempts,
          questionCount: item.evaluation.questionCount,
        })
        : null,
      attempts,
      canStart: item.assignment.state === ACTIVE_ASSIGNMENT_STATE && (hasOpenAttempt || item.attempts.length < maxAttempts),
    });
  }

  private static _toPartialClosedScore({ attempt, evaluation }: StudentEvaluationAttemptDetailResult): PartialClosedScoreDTO | null {
    if (attempt.status !== PENDING_REVIEW_ATTEMPT_STATUS || attempt.isPublished || !immediateFeedbackFor(evaluation.type)) {
      return null;
    }

    const answers: Map<string, EvaluationAnswerRecord> = new Map<string, EvaluationAnswerRecord>(
      attempt.answers.map((answer: EvaluationAnswerRecord) => [answer.questionId, answer]),
    );

    return new PartialClosedScoreDTO(computePartialClosedScore(evaluation.questions, answers));
  }

  private static _toQuestionDTO(
    question: EvaluationQuestionItem,
    position: number,
    answer: EvaluationAnswerRecord | undefined,
    { published, evaluationType }: { published: boolean; evaluationType: EvaluationTypeValue },
    media: MediaLookup,
  ): StudentQuestionDTO {
    return new StudentQuestionDTO({
      id: question.id,
      scenarioId: question.scenarioId ?? null,
      position,
      type: question.type,
      prompt: question.prompt,
      media: StudentEvaluationsMapper._toMediaList(question.mediaIds, media),
      points: question.points,
      clinicalCaseId: question.clinicalCaseId ?? null,
      options: question.options.map((option: EvaluationOptionItem) => StudentEvaluationsMapper._toOptionDTO(option, published, media)),
      answer: answer
        ? new StudentAnswerDTO({
          selectedOptionIds: [...answer.selectedOptionIds],
          textAnswer: answer.textAnswer ?? null,
          simulationSessionId: answer.simulationSessionId ?? null,
        })
        : null,
      hint: evaluationType === WORKSHOP_EVALUATION_TYPE ? (question.hint ?? null) : null,
      reveal: StudentEvaluationsMapper._toRevealDTO(question, answer),
      published: published
        ? {
          explanation: question.explanation ?? null,
          rubric: question.rubric ?? null,
          earnedScore: answer?.manualScore ?? answer?.autoScore ?? null,
        }
        : undefined,
    });
  }

  // Only an answer the student checked carries its correction before the grade is published.
  private static _toRevealDTO(question: EvaluationQuestionItem, answer: EvaluationAnswerRecord | undefined): StudentAnswerRevealDTO | null {
    if (answer?.revealedAt === undefined) {
      return null;
    }

    return new StudentAnswerRevealDTO({
      revealedAt: answer.revealedAt,
      isCorrect: isChoiceAnswerCorrect(question, answer.selectedOptionIds),
      correctOptionIds: correctOptionIds(question),
      explanation: question.explanation ?? null,
    });
  }

  private static _toOptionDTO(option: EvaluationOptionItem, published: boolean, media: MediaLookup): StudentOptionDTO {
    const resolved: ResolvedMediaURL | undefined = option.mediaId ? media.get(option.mediaId) : undefined;

    return new StudentOptionDTO({
      id: option.id,
      order: option.order,
      content: option.content,
      media: resolved ? StudentEvaluationsMapper._toMediaDTO(resolved) : null,
      isCorrect: published ? option.isCorrect : undefined,
      feedback: published ? (option.legacyFeedback ?? null) : undefined,
    });
  }

  private static _toMediaList(mediaIds: ReadonlyArray<string>, media: MediaLookup): EvaluationMediaDTO[] {
    return mediaIds.flatMap((id: string) => {
      const resolved: ResolvedMediaURL | undefined = media.get(id);

      return resolved ? [StudentEvaluationsMapper._toMediaDTO(resolved)] : [];
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
}
