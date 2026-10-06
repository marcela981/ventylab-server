/*
 * Funcionalidad: Repositorio de intentos de evaluación de estudiantes
 * Descripción: Contrato de persistencia del agregado StudentEvaluationAttempt (carga con respuestas, intento en curso no heredado, contadores de intentos incluidos los heredados, intentos en curso de un usuario, guardado con upsert de respuestas por pregunta), de los candados transaccionales exclusivo y compartido y de las vistas del listado del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentEvaluationAttempt } from "@/features/evaluation/domain/entities/student-evaluation-attempt.entity";
import {
  type StudentAttemptSummaryView,
  type StudentEvaluationBriefView,
} from "@/features/evaluation/domain/read-models/student-evaluation.read-model";

export const STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN: unique symbol = Symbol("STUDENT_EVALUATION_ATTEMPTS_REPOSITORY_TOKEN");

export interface AttemptCounters {
  readonly count: number;
  readonly maxAttemptNumber: number;
}

export interface IStudentEvaluationAttemptsRepository {
  acquireTransactionLock(key: string, transaction: unknown): Promise<void>;
  acquireSharedTransactionLock(key: string, transaction: unknown): Promise<void>;
  getById(id: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined>;
  getInProgress(evaluationId: string, userId: string, transaction?: unknown): Promise<StudentEvaluationAttempt | undefined>;
  getAttemptCounters(evaluationId: string, userId: string, transaction?: unknown): Promise<AttemptCounters>;
  getInProgressByUser(userId: string): Promise<StudentEvaluationAttempt[]>;
  getUserAttemptSummaries(userId: string, evaluationIds: ReadonlyArray<string>): Promise<StudentAttemptSummaryView[]>;
  getStudentEvaluationBriefs(evaluationIds: ReadonlyArray<string>): Promise<StudentEvaluationBriefView[]>;
  save(attempt: StudentEvaluationAttempt, transaction?: unknown): Promise<void>;
}
