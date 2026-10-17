/*
 * Funcionalidad: Diccionario de datos de la exportación de investigación
 * Descripción: Definición única de las columnas del CSV de investigación en formato largo (nombre, tipo, descripción en español y ejemplo), usada por el escritor del CSV para el orden de columnas, por la ruta del diccionario de datos y por docs/operation/RESEARCH-EXPORT-DICTIONARY.md
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResearchDatasetRow } from "@/features/analytics/application/results/analytics.results";

export type ResearchExportColumnTypeValue = "string" | "number";

export interface ResearchExportColumnDefinition {
  readonly column: keyof ResearchDatasetRow;
  readonly type: ResearchExportColumnTypeValue;
  readonly description: string;
  readonly example?: string;
}

const HMAC_EXAMPLE: string = "3f9a1c0e5b7d2a4c6e8f0a1b3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d";

export const RESEARCH_EXPORT_DICTIONARY: readonly ResearchExportColumnDefinition[] = [
  {
    column: "participant",
    type: "string",
    description: "Seudónimo del estudiante: HMAC-SHA256 del identificador de usuario con ANALYTICS_EXPORT_SALT, en hexadecimal en minúsculas; la misma sal produce el mismo seudónimo en todas las exportaciones",
    example: HMAC_EXAMPLE,
  },
  {
    column: "group",
    type: "string",
    description: "Seudónimo del grupo de estudiantes: HMAC-SHA256 del identificador del grupo con la misma sal, en hexadecimal en minúsculas",
    example: HMAC_EXAMPLE,
  },
  {
    column: "domain",
    type: "string",
    description: "Dominio de la medida: progress (progreso), grades (notas), simulation (simulación), ai_telemetry (uso de IA) o ai_ratings (valoraciones de IA)",
    example: "progress",
  },
  {
    column: "item",
    type: "string",
    description:
      "Elemento medido dentro del dominio: overall o el identificador de la sección en progress, el seudónimo HMAC-SHA256 del prefijo evaluation: seguido del identificador de la evaluación en grades, all en simulation y el nombre del caso de uso de IA en ai_telemetry y ai_ratings",
    example: "overall",
  },
  {
    column: "metric",
    type: "string",
    description:
      "Medida: percentage (progress); grade (grades); session_count, average_score y average_time_to_stabilize_s (simulation); calls, input_tokens, output_tokens y average_latency_ms (ai_telemetry); ratings, helpful_rate y <dimensión>_mean para quality, understanding, expression, safety y trust (ai_ratings)",
    example: "percentage",
  },
  {
    column: "value",
    type: "number",
    description:
      "Valor numérico de la medida: porcentaje 0–100 en progress, nota en la escala 0–5 en grades, conteos enteros, segundos, milisegundos, proporción 0–1 en helpful_rate y media de la escala de valoración en las dimensiones",
    example: "40",
  },
];

export const RESEARCH_CSV_COLUMNS: readonly (keyof ResearchDatasetRow)[] = RESEARCH_EXPORT_DICTIONARY.map(
  (definition: ResearchExportColumnDefinition) => definition.column,
);
