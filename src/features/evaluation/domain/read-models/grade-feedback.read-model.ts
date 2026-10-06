/*
 * Funcionalidad: Modelo de lectura de la retroalimentación de calificación
 * Descripción: Fila persistida de retroalimentación de un intento: global (sin pregunta) o por pregunta, con contenido, origen, proveedor y modelo y estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GradeFeedbackSource } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { type GradeFeedbackStatusValue } from "@/features/evaluation/domain/value-objects/grade-feedback-status";

export interface GradeFeedbackRecord {
  readonly id: string;
  readonly attemptId: string;
  readonly questionId?: string;
  readonly content: string;
  readonly source: GradeFeedbackSource;
  readonly provider?: string;
  readonly model?: string;
  readonly status: GradeFeedbackStatusValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
