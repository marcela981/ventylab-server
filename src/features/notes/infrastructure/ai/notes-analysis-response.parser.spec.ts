/*
 * Funcionalidad: Pruebas del parser de la respuesta del análisis de notas
 * Descripción: Verifica el parseo de JSON plano, JSON en bloque cercado y JSON rodeado de texto, la normalización de listas y el error de dominio ante respuestas no utilizables
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { NotesAnalysisInvalidResponseError } from "@/features/notes/domain/notes.errors";
import { type NotesAnalysisContent } from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { MAX_ANALYSIS_LIST_ITEMS, parseNotesAnalysisResponse } from "@/features/notes/infrastructure/ai/notes-analysis-response.parser";

const VALID_JSON: string = JSON.stringify({
  summary: "The notes cover PEEP and tidal volume.",
  keyConcepts: ["PEEP", "Tidal volume"],
  gaps: ["Plateau pressure"],
  suggestions: ["Review compliance"],
});

describe("parseNotesAnalysisResponse", () => {
  it("should parse a plain JSON response", () => {
    const result: NotesAnalysisContent = parseNotesAnalysisResponse(VALID_JSON);

    expect(result).toEqual({
      summary: "The notes cover PEEP and tidal volume.",
      keyConcepts: ["PEEP", "Tidal volume"],
      gaps: ["Plateau pressure"],
      suggestions: ["Review compliance"],
    });
  });

  it("should parse a fenced JSON response", () => {
    const result: NotesAnalysisContent = parseNotesAnalysisResponse(`Here is the analysis:\n\`\`\`json\n${VALID_JSON}\n\`\`\`\nThanks`);

    expect(result.keyConcepts).toEqual(["PEEP", "Tidal volume"]);
  });

  it("should parse JSON surrounded by prose", () => {
    const result: NotesAnalysisContent = parseNotesAnalysisResponse(`Sure! ${VALID_JSON} Hope it helps.`);

    expect(result.summary).toBe("The notes cover PEEP and tidal volume.");
  });

  it("should normalize lists, accept snake case keys and default missing lists", () => {
    const items: string[] = Array.from({ length: MAX_ANALYSIS_LIST_ITEMS + 5 }, (_value: unknown, index: number) => `Concept ${index}`);

    const result: NotesAnalysisContent = parseNotesAnalysisResponse(
      JSON.stringify({ summary: "  Summary  ", key_concepts: [...items, 3, "  "], gaps: "not a list" }),
    );

    expect(result.summary).toBe("Summary");
    expect(result.keyConcepts).toHaveLength(MAX_ANALYSIS_LIST_ITEMS);
    expect(result.gaps).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it("should throw a domain error for garbage", () => {
    const act = (): NotesAnalysisContent => parseNotesAnalysisResponse("I cannot help with that.");

    expect(act).toThrow(NotesAnalysisInvalidResponseError);
  });

  it("should throw a domain error for malformed JSON", () => {
    const act = (): NotesAnalysisContent => parseNotesAnalysisResponse("{\"summary\": \"x\", \"gaps\": [}");

    expect(act).toThrow(NotesAnalysisInvalidResponseError);
  });

  it("should throw a domain error when the summary is missing", () => {
    const act = (): NotesAnalysisContent => parseNotesAnalysisResponse(JSON.stringify({ keyConcepts: ["PEEP"] }));

    expect(act).toThrow(NotesAnalysisInvalidResponseError);
  });
});
