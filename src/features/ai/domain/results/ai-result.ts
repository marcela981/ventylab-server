/*
 * Funcionalidad: Resultados del gateway de IA
 * Descripción: Tipos del resultado de una llamada al gateway de IA (contenido, origen LLM o determinista, proveedor, modelo, id de llamada), de los fragmentos de un stream y del estado final de la llamada (incluida la bloqueada por estar fuera de tema)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type AiResultSource = "LLM" | "DETERMINISTIC";

export type AiCallStatus = "SUCCESS" | "FALLBACK" | "ERROR" | "ABORTED" | "BLOCKED_OFFTOPIC";

export interface AiResult {
  readonly content: string;
  readonly source: AiResultSource;
  readonly provider?: string;
  readonly model?: string;
  readonly aiCallId: string;
}

export interface AiDeltaChunk {
  readonly type: "delta";
  readonly text: string;
}

export interface AiDoneChunk {
  readonly type: "done";
  readonly result: AiResult;
}

export type AiStreamChunk = AiDeltaChunk | AiDoneChunk;
