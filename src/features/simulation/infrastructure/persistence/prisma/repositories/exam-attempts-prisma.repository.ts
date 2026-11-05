/*
 * Funcionalidad: Lector Prisma de intentos de examen para simulación
 * Descripción: Implementa IExamAttemptReader leyendo directamente student_evaluation_attempts y evaluation_questions con PrismaService (dueño, estado, fecha límite y evaluación del intento; tipo, evaluación, caso clínico y rúbrica de la pregunta) sin depender de la feature de evaluaciones
 * Versión: 1.1 (marcas de liberación y lectura por lote)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ExamAttemptInfo,
  type ExamQuestionInfo,
  type IExamAttemptReader,
} from "@/features/simulation/application/ports/exam-attempt-reader.interface";

interface AttemptRow {
  readonly id: string;
  readonly userId: string;
  readonly evaluationId: string;
  readonly status: string;
  readonly deadlineAt: Date | null;
  readonly gradePublishedAt: Date | null;
  readonly answersReleasedAt: Date | null;
}

const ATTEMPT_SELECT: { [K in keyof AttemptRow]: true } = {
  id: true,
  userId: true,
  evaluationId: true,
  status: true,
  deadlineAt: true,
  gradePublishedAt: true,
  answersReleasedAt: true,
};

function toAttemptInfo(row: AttemptRow): ExamAttemptInfo {
  return {
    id: row.id,
    userId: row.userId,
    evaluationId: row.evaluationId,
    status: row.status,
    deadlineAt: row.deadlineAt ?? undefined,
    gradePublishedAt: row.gradePublishedAt ?? undefined,
    answersReleasedAt: row.answersReleasedAt ?? undefined,
  };
}

interface QuestionRow {
  readonly id: string;
  readonly evaluationId: string;
  readonly type: string;
  readonly clinicalCaseId: string | null;
  readonly rubric: Prisma.JsonValue | null;
}

@Injectable()
export class ExamAttemptsPrismaRepository implements IExamAttemptReader {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getAttempt(attemptId: string): Promise<ExamAttemptInfo | undefined> {
    const row: AttemptRow | null = await this._prisma.studentEvaluationAttempt.findUnique({ where: { id: attemptId }, select: ATTEMPT_SELECT });

    return row ? toAttemptInfo(row) : undefined;
  }

  public async getAttempts(attemptIds: readonly string[]): Promise<ExamAttemptInfo[]> {
    if (attemptIds.length === 0) {
      return [];
    }

    const rows: AttemptRow[] = await this._prisma.studentEvaluationAttempt.findMany({ where: { id: { in: [...attemptIds] } }, select: ATTEMPT_SELECT });

    return rows.map(toAttemptInfo);
  }

  public async getQuestion(questionId: string): Promise<ExamQuestionInfo | undefined> {
    const row: QuestionRow | null = await this._prisma.evaluationQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, evaluationId: true, type: true, clinicalCaseId: true, rubric: true },
    });

    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      evaluationId: row.evaluationId,
      type: row.type,
      clinicalCaseId: row.clinicalCaseId ?? undefined,
      rubric: row.rubric ?? undefined,
    };
  }
}
