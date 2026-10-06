/*
 * Funcionalidad: Dobles de prueba de la retroalimentación de calificación
 * Descripción: Repositorio en memoria de GradeFeedback (candado registrado, lectura por intento, reemplazo y cambio de estado), generador de retroalimentación simulado e intento calificado de ejemplo para las pruebas de generación, regeneración y lectura
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IGradeFeedbackGenerator } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { GradeFeedbackAccess } from "@/features/evaluation/application/services/grade-feedback-access";
import { type AttemptDoubles, buildStoredAttempt, minutesFromNow } from "@/features/evaluation/application/testing/evaluation-attempt-test-doubles-spec";
import {
  type StudentEvaluationAttempt,
  type StudentEvaluationAttemptProps,
} from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import { type GeneratedGradeFeedback } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { type GradeFeedbackStatusValue } from "@/features/evaluation/domain/value-objects/grade-feedback-status";
import { type GroupsFacade } from "@/features/groups/application/services/groups.facade";

export class InMemoryGradeFeedbacksRepository implements IGradeFeedbacksRepository {
  public records: GradeFeedbackRecord[] = [];
  public readonly locks: string[] = [];

  public constructor(records: GradeFeedbackRecord[] = []) {
    this.records = [...records];
  }

  public async acquireTransactionLock(key: string): Promise<void> {
    await Promise.resolve();

    this.locks.push(key);
  }

  public async getByAttempt(attemptId: string): Promise<GradeFeedbackRecord[]> {
    await Promise.resolve();

    return this.records.filter((record: GradeFeedbackRecord) => record.attemptId === attemptId).map((record: GradeFeedbackRecord) => ({ ...record }));
  }

  public async replaceForAttempt(attemptId: string, records: ReadonlyArray<GradeFeedbackRecord>): Promise<void> {
    await Promise.resolve();

    this.records = [...this.records.filter((record: GradeFeedbackRecord) => record.attemptId !== attemptId), ...records.map((record: GradeFeedbackRecord) => ({ ...record }))];
  }

  public async updateStatus(id: string, status: GradeFeedbackStatusValue, now: Date): Promise<void> {
    await Promise.resolve();

    this.records = this.records.map((record: GradeFeedbackRecord) => (record.id === id ? { ...record, status, updatedAt: now } : record));
  }
}

export function feedbackRecord(overrides: Partial<GradeFeedbackRecord> = {}): GradeFeedbackRecord {
  return {
    id: "feedback-1",
    attemptId: "attempt-1",
    content: "Buen trabajo.",
    source: "LLM",
    provider: "gemini",
    model: "gemini-2.0-flash",
    status: "READY",
    createdAt: minutesFromNow(-5),
    updatedAt: minutesFromNow(-5),
    ...overrides,
  };
}

export const GENERATED_FEEDBACK: GeneratedGradeFeedback = {
  overall: "Buen trabajo en general.",
  perQuestion: [
    { questionId: "q1", content: "Correcto." },
    { questionId: "q2", content: "Revisa la PEEP." },
  ],
  source: "LLM",
  provider: "gemini",
  model: "gemini-2.0-flash",
};

export function feedbackGenerator(generate: jest.Mock = jest.fn().mockResolvedValue(GENERATED_FEEDBACK)): IGradeFeedbackGenerator {
  return { generate };
}

export function gradedAttempt(overrides: Partial<StudentEvaluationAttemptProps> = {}): StudentEvaluationAttempt {
  return buildStoredAttempt({
    status: "GRADED",
    submittedAt: minutesFromNow(-1),
    score: 1,
    maxScore: 2,
    grade: 2.5,
    answers: [
      { id: "answer-1", questionId: "q1", selectedOptionIds: ["q1-ok"], autoScore: 1 },
      { id: "answer-2", questionId: "q2", selectedOptionIds: ["q2-ko"], autoScore: 0 },
    ],
    ...overrides,
  });
}

export function gradeFeedbackAccess(doubles: AttemptDoubles, canManageGroup: jest.Mock = jest.fn().mockResolvedValue(true)): GradeFeedbackAccess {
  return new GradeFeedbackAccess({ canManageGroup } as unknown as GroupsFacade, doubles.assignmentsRepository, doubles.evaluationsRepository);
}
