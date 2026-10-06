/*
 * Funcionalidad: CSV de valoraciones de IA
 * Descripción: Serializa las filas de valoraciones de IA a CSV (RFC 4180, neutralización de fórmulas) con la utilidad común; por seudonimato no incluye identificador ni datos del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toCsv } from "@/common/presentation/utils/csv.util";
import { type AiRatingExportRow } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";

export const AI_RATINGS_CSV_COLUMNS: readonly (keyof AiRatingExportRow)[] = [
  "targetType",
  "targetId",
  "helpful",
  "quality",
  "understanding",
  "expression",
  "safety",
  "trust",
  "comment",
  "createdAt",
  "useCase",
  "provider",
  "model",
  "promptVersion",
] as const;

export function toAiRatingsCsv(rows: readonly AiRatingExportRow[]): string {
  return toCsv(rows, AI_RATINGS_CSV_COLUMNS);
}
