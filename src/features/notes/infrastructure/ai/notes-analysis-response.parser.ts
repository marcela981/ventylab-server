/*
 * Funcionalidad: Parser de la respuesta del análisis de notas
 * Descripción: Extrae y valida el JSON del análisis devuelto por el modelo de lenguaje (texto plano, bloque cercado con ``` o JSON rodeado de texto), normaliza las listas y lanza un error de dominio cuando la respuesta no es utilizable
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { NotesAnalysisInvalidResponseError } from "@/features/notes/domain/notes.errors";
import { type NotesAnalysisContent } from "@/features/notes/domain/read-models/notes-analysis.read-model";

export const MAX_ANALYSIS_LIST_ITEMS: number = 10;

const FENCED_BLOCK_PATTERN: RegExp = /```(?:json)?\s*([\s\S]*?)```/i;

function extractJSONCandidate(text: string): string | undefined {
  const fenced: RegExpExecArray | null = FENCED_BLOCK_PATTERN.exec(text);
  const source: string = fenced ? fenced[1] : text;
  const start: number = source.indexOf("{");
  const end: number = source.lastIndexOf("}");

  return start !== -1 && end > start ? source.slice(start, end + 1) : undefined;
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item: unknown): item is string => typeof item === "string")
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 0)
    .slice(0, MAX_ANALYSIS_LIST_ITEMS);
}

export function parseNotesAnalysisResponse(text: string): NotesAnalysisContent {
  const candidate: string | undefined = extractJSONCandidate(text);

  if (candidate === undefined) {
    throw new NotesAnalysisInvalidResponseError();
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new NotesAnalysisInvalidResponseError();
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new NotesAnalysisInvalidResponseError();
  }

  const record: Record<string, unknown> = parsed as Record<string, unknown>;
  const summary: string = typeof record.summary === "string" ? record.summary.trim() : "";

  if (summary.length === 0) {
    throw new NotesAnalysisInvalidResponseError();
  }

  return {
    summary,
    keyConcepts: toStringList(record.keyConcepts ?? record.key_concepts),
    gaps: toStringList(record.gaps),
    suggestions: toStringList(record.suggestions),
  };
}
