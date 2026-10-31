/*
 * Funcionalidad: Resultados de la retroalimentación de calificación
 * Descripción: Retroalimentación de un intento separada en global y por pregunta, y resultado de una regeneración aceptada (fila PENDING reservada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackRatingView } from "@/features/evaluation/application/ports/grade-feedback-ratings-reader.interface";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { type GradeFeedbackStatusValue } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

export class GradeFeedbackResult {
  public readonly attemptId: string;
  public readonly overall?: GradeFeedbackRecord;
  public readonly questions: ReadonlyArray<GradeFeedbackRecord>;
  // Own ratings of the caller keyed by feedback ID (student read only)
  public readonly ratings: ReadonlyMap<string, GradeFeedbackRatingView>;

  public constructor({
    attemptId,
    overall,
    questions,
    ratings = new Map<string, GradeFeedbackRatingView>(),
  }: {
    attemptId: string;
    overall?: GradeFeedbackRecord;
    questions: ReadonlyArray<GradeFeedbackRecord>;
    ratings?: ReadonlyMap<string, GradeFeedbackRatingView>;
  }) {
    this.attemptId = attemptId;
    this.overall = overall;
    this.questions = questions;
    this.ratings = ratings;
  }
}

export class GradeFeedbackRegenerationResult {
  public readonly attemptId: string;
  public readonly feedbackId: string;
  public readonly status: GradeFeedbackStatusValue;

  public constructor({ attemptId, feedbackId, status }: { attemptId: string; feedbackId: string; status: GradeFeedbackStatusValue }) {
    this.attemptId = attemptId;
    this.feedbackId = feedbackId;
    this.status = status;
  }
}
