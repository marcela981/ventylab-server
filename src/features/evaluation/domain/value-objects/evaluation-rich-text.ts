/*
 * Funcionalidad: Contenido enriquecido de evaluaciones
 * Descripción: Sanea documentos Tiptap (enunciados de pregunta, contenido de escenarios y descripción) reutilizando el saneador de notas (sanitizeTiptapDocument) y traduce sus fallos a InvalidEvaluationRichTextError; la descripción se guarda como texto plano o como documento Tiptap serializado y se vuelve a leer en la misma forma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidEvaluationRichTextError } from "@/features/evaluation/domain/evaluation.errors";
import { InvalidNoteContentError } from "@/features/notes/domain/notes.errors";
import { sanitizeTiptapDocument, type TiptapDocument } from "@/features/notes/domain/services/tiptap-document";

export type EvaluationRichTextDocument = Record<string, unknown>;

export type EvaluationDescriptionInput = string | EvaluationRichTextDocument;

const SERIALIZED_DOCUMENT_PREFIX: string = "{\"type\":\"doc\"";

export function toEvaluationRichText(value: unknown): EvaluationRichTextDocument {
  try {
    const document: TiptapDocument = sanitizeTiptapDocument(value);

    return { ...document };
  } catch (error) {
    // The note sanitizer reports its own feature error; evaluation callers must see an evaluation error
    if (error instanceof InvalidNoteContentError) {
      throw new InvalidEvaluationRichTextError(error.message);
    }

    throw error;
  }
}

export function toEvaluationDescription(value: EvaluationDescriptionInput): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(toEvaluationRichText(value));
}

export function readEvaluationDescription(stored: string): EvaluationDescriptionInput {
  if (!stored.startsWith(SERIALIZED_DOCUMENT_PREFIX)) {
    return stored;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as EvaluationRichTextDocument) : stored;
  } catch {
    return stored;
  }
}
