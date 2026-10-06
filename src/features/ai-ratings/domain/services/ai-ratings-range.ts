/*
 * Funcionalidad: Validación del rango de estadísticas de valoraciones de IA
 * Descripción: Exige que el rango de fechas de las estadísticas y la exportación de valoraciones empiece antes de terminar y abarque como máximo 366 días
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAiRatingsRangeError } from "@/features/ai-ratings/domain/ai-ratings.errors";

export const AI_RATINGS_MAX_RANGE_DAYS: number = 366;

const DAY_MS: number = 24 * 60 * 60 * 1000;

export function assertValidAiRatingsRange(from: Date, to: Date): void {
  if (from.getTime() >= to.getTime() || to.getTime() - from.getTime() > AI_RATINGS_MAX_RANGE_DAYS * DAY_MS) {
    throw new InvalidAiRatingsRangeError();
  }
}
