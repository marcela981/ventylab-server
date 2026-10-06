/*
 * Funcionalidad: Repositorio de retroalimentación de calificación
 * Descripción: Contrato de persistencia de las filas GradeFeedback de un intento: candado transaccional, lectura por intento, reemplazo completo (borrado e inserción) y cambio de estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { type GradeFeedbackStatusValue } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

export const GRADE_FEEDBACKS_REPOSITORY_TOKEN: unique symbol = Symbol("GRADE_FEEDBACKS_REPOSITORY_TOKEN");

export interface IGradeFeedbacksRepository {
  acquireTransactionLock(key: string, transaction: unknown): Promise<void>;
  getByAttempt(attemptId: string, transaction?: unknown): Promise<GradeFeedbackRecord[]>;
  replaceForAttempt(attemptId: string, records: ReadonlyArray<GradeFeedbackRecord>, transaction: unknown): Promise<void>;
  updateStatus(id: string, status: GradeFeedbackStatusValue, now: Date, transaction?: unknown): Promise<void>;
}
