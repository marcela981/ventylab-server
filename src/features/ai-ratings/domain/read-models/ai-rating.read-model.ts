/*
 * Funcionalidad: Modelos de lectura de las valoraciones de IA
 * Descripción: Tipos de objetivo valorable y dimensiones QUEST (Tam et al. 2024, npj Digital Medicine), casos de uso de IA esperados por tipo de objetivo, filtros y agregados de estadísticas por caso de uso, proveedor, modelo y versión de prompt, y filas exportables sin identificador de usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiTelemetryUseCaseValue } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export type AiRatingTargetTypeValue = "GRADE_FEEDBACK" | "MESSAGE" | "NOTES_ANALYSIS" | "SIM_ASSIST";

export const AI_RATING_TARGET_TYPE_VALUES: readonly AiRatingTargetTypeValue[] = ["GRADE_FEEDBACK", "MESSAGE", "NOTES_ANALYSIS", "SIM_ASSIST"] as const;

export type AiRatingDimension = "quality" | "understanding" | "expression" | "safety" | "trust";

export const AI_RATING_DIMENSIONS: readonly AiRatingDimension[] = ["quality", "understanding", "expression", "safety", "trust"] as const;

export type AiRatingDimensionScores = Readonly<Record<AiRatingDimension, number | undefined>>;

// A client-sent aiCallId is only linked when the call was produced by one of the use cases that can emit this kind of target.
export const AI_RATING_TARGET_USE_CASES: Readonly<Record<AiRatingTargetTypeValue, readonly AiTelemetryUseCaseValue[]>> = {
  GRADE_FEEDBACK: ["GRADE_FEEDBACK"],
  MESSAGE: ["PAGE_DEEPEN", "LESSON_QA", "FREE_CHAT"],
  NOTES_ANALYSIS: ["NOTES_ANALYSIS"],
  SIM_ASSIST: ["SIM_ASSIST"],
};

// Group value for ratings without a linked AI call (or a call without that attribute).
export const UNKNOWN_AI_RATING_GROUP: string = "unknown";

export interface AiRatingStatsFilters {
  readonly from: Date;
  readonly to: Date;
  readonly targetType?: AiRatingTargetTypeValue;
  readonly useCase?: AiTelemetryUseCaseValue;
  readonly provider?: string;
  readonly model?: string;
  readonly promptVersion?: string;
}

export interface AiRatingDimensionStats {
  readonly mean?: number;
  readonly n: number;
}

export interface AiRatingGroupAggregate {
  readonly useCase: string;
  readonly provider: string;
  readonly model: string;
  readonly promptVersion: string;
  readonly ratings: number;
  readonly helpfulCount: number;
  readonly dimensions: Readonly<Record<AiRatingDimension, AiRatingDimensionStats>>;
}

export interface AiRatingStatsGroup extends AiRatingGroupAggregate {
  readonly helpfulRate: number;
}

export interface AiRatingStats {
  readonly from: Date;
  readonly to: Date;
  readonly groups: AiRatingStatsGroup[];
}

export interface AiRatingExportRow {
  readonly targetType: AiRatingTargetTypeValue;
  readonly targetId: string;
  readonly helpful: boolean;
  readonly quality?: number;
  readonly understanding?: number;
  readonly expression?: number;
  readonly safety?: number;
  readonly trust?: number;
  readonly comment?: string;
  readonly createdAt: Date;
  readonly useCase?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly promptVersion?: string;
}
