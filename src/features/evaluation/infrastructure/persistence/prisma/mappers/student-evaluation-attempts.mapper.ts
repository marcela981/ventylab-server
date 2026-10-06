/*
 * Funcionalidad: Mapeador Prisma de intentos de evaluación de estudiantes
 * Descripción: Convierte filas student_evaluation_attempts con sus evaluation_answers al agregado StudentEvaluationAttempt y de vuelta (intento sin respuestas y cada respuesta por separado para el upsert por (intento, pregunta)), y filas de resumen a las vistas del listado del estudiante; los campos heredados (legacySource, legacyPayload) nunca se escriben desde aquí; cada respuesta incluye la calificación docente (puntaje manual, comentario y profesor que calificó)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type EvaluationAnswer as EvaluationAnswerModel,
  type EvaluationType,
  type Prisma,
  type StudentEvaluationAttempt as StudentEvaluationAttemptModel,
} from "@prisma/client";

import {
  type EvaluationAnswerRecord,
  StudentEvaluationAttempt,
} from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";

export const STUDENT_ATTEMPT_INCLUDE: { answers: true } = { answers: true };

export type StudentAttemptRow = StudentEvaluationAttemptModel & { answers: EvaluationAnswerModel[] };

export const STUDENT_ATTEMPT_SUMMARY_SELECT: {
  id: true;
  evaluationId: true;
  assignmentId: true;
  attemptNumber: true;
  status: true;
  startedAt: true;
  submittedAt: true;
  deadlineAt: true;
  score: true;
  maxScore: true;
  grade: true;
  gradePublishedAt: true;
} = {
  id: true,
  evaluationId: true,
  assignmentId: true,
  attemptNumber: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  deadlineAt: true,
  score: true,
  maxScore: true,
  grade: true,
  gradePublishedAt: true,
};

export type StudentAttemptSummaryRow = Pick<StudentEvaluationAttemptModel, keyof typeof STUDENT_ATTEMPT_SUMMARY_SELECT>;

export interface StudentEvaluationBriefRow {
  id: string;
  title: string;
  type: EvaluationType;
  description: string | null;
  durationMinutes: number | null;
  maxAttempts: number;
  showResultsImmediately: boolean;
  _count: { questions: number };
}

export type StudentAttemptMutableFields = Pick<
  StudentEvaluationAttemptModel,
  "status" | "submittedAt" | "deadlineAt" | "score" | "maxScore" | "grade" | "gradePublishedAt" | "isLate" | "updatedAt"
>;

export class StudentEvaluationAttemptsMapper {
  public static toDomain(row: StudentAttemptRow): StudentEvaluationAttempt {
    return StudentEvaluationAttempt.reconstitute({
      id: row.id,
      evaluationId: row.evaluationId,
      assignmentId: row.assignmentId ?? undefined,
      userId: row.userId,
      attemptNumber: row.attemptNumber,
      status: row.status,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt ?? undefined,
      deadlineAt: row.deadlineAt ?? undefined,
      score: row.score ?? undefined,
      maxScore: row.maxScore ?? undefined,
      grade: row.grade ?? undefined,
      gradePublishedAt: row.gradePublishedAt ?? undefined,
      isLate: row.isLate,
      legacySource: row.legacySource ?? undefined,
      answers: row.answers.map((answer: EvaluationAnswerModel) => StudentEvaluationAttemptsMapper._toAnswer(answer)),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toCreate(attempt: StudentEvaluationAttempt): Prisma.StudentEvaluationAttemptUncheckedCreateInput {
    return {
      id: attempt.id,
      evaluationId: attempt.evaluationId,
      assignmentId: attempt.assignmentId ?? null,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
      ...StudentEvaluationAttemptsMapper.toUpdate(attempt),
      startedAt: attempt.startedAt,
      createdAt: attempt.createdAt,
    };
  }

  public static toUpdate(attempt: StudentEvaluationAttempt): StudentAttemptMutableFields {
    return {
      status: attempt.status,
      submittedAt: attempt.submittedAt ?? null,
      deadlineAt: attempt.deadlineAt ?? null,
      score: attempt.score ?? null,
      maxScore: attempt.maxScore ?? null,
      grade: attempt.grade ?? null,
      gradePublishedAt: attempt.gradePublishedAt ?? null,
      isLate: attempt.isLate,
      updatedAt: attempt.updatedAt,
    };
  }

  public static toAnswerCreate(attemptId: string, answer: EvaluationAnswerRecord): Prisma.EvaluationAnswerUncheckedCreateInput {
    return {
      id: answer.id,
      attemptId,
      questionId: answer.questionId,
      ...StudentEvaluationAttemptsMapper.toAnswerUpdate(answer),
    };
  }

  public static toAnswerUpdate(answer: EvaluationAnswerRecord): {
    selectedOptionIds: string[];
    textAnswer: string | null;
    simulationSessionId: string | null;
    autoScore: number | null;
    manualScore: number | null;
    teacherComment: string | null;
    gradedById: string | null;
  } {
    return {
      selectedOptionIds: [...answer.selectedOptionIds],
      textAnswer: answer.textAnswer ?? null,
      simulationSessionId: answer.simulationSessionId ?? null,
      autoScore: answer.autoScore ?? null,
      manualScore: answer.manualScore ?? null,
      teacherComment: answer.teacherComment ?? null,
      gradedById: answer.gradedById ?? null,
    };
  }

  public static toSummary(row: StudentAttemptSummaryRow): StudentAttemptSummaryView {
    return {
      id: row.id,
      evaluationId: row.evaluationId,
      assignmentId: row.assignmentId ?? undefined,
      attemptNumber: row.attemptNumber,
      status: row.status,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt ?? undefined,
      deadlineAt: row.deadlineAt ?? undefined,
      score: row.score ?? undefined,
      maxScore: row.maxScore ?? undefined,
      grade: row.grade ?? undefined,
      gradePublishedAt: row.gradePublishedAt ?? undefined,
    };
  }

  public static toBrief(row: StudentEvaluationBriefRow): StudentEvaluationBriefView {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      description: row.description ?? undefined,
      durationMinutes: row.durationMinutes ?? undefined,
      maxAttempts: row.maxAttempts,
      questionCount: row._count.questions,
      showResultsImmediately: row.showResultsImmediately,
    };
  }

  private static _toAnswer(answer: EvaluationAnswerModel): EvaluationAnswerRecord {
    return {
      id: answer.id,
      questionId: answer.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      textAnswer: answer.textAnswer ?? undefined,
      simulationSessionId: answer.simulationSessionId ?? undefined,
      autoScore: answer.autoScore ?? undefined,
      manualScore: answer.manualScore ?? undefined,
      teacherComment: answer.teacherComment ?? undefined,
      gradedById: answer.gradedById ?? undefined,
    };
  }
}
