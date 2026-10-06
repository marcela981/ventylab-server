/*
 * Funcionalidad: Pruebas del adaptador AITextNotesAnalyzer
 * Descripción: Verifica que el análisis de notas use el gateway de IA (caso NOTES_ANALYSIS con el prompt del consumidor, idioma, usuario y rol para cuotas y telemetría, sin respaldo determinista), devuelva el id de la llamada para calificarla y propague los errores de proveedores y de respuesta inválida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallOptions, type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiProvidersUnavailableError } from "@/features/ai/domain/ai.errors";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type NotesAnalysisContext, type NotesAnalysisNote } from "@/features/notes/application/ports/notes-analyzer.interface";
import { NotesAnalysisInvalidResponseError } from "@/features/notes/domain/notes.errors";
import { type NotesAnalysis } from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { AITextNotesAnalyzer } from "@/features/notes/infrastructure/ai/ai-text-notes-analyzer";
import { buildNotesAnalysisPrompt } from "@/features/notes/infrastructure/ai/notes-analysis-prompt";

const NOTES: NotesAnalysisNote[] = [{ lessonTitle: "PEEP", moduleTitle: "Fundamentos", text: "La PEEP evita el colapso alveolar." }];
const CONTEXT: NotesAnalysisContext = { scope: "lesson", lessonTitle: "PEEP", moduleTitle: "Fundamentos", language: "en", userId: "user-1", userRole: "STUDENT" };
const VALID_RESPONSE: string = JSON.stringify({ summary: "Resumen", keyConcepts: ["PEEP"], gaps: [], suggestions: ["Repasar"] });

function buildGateway(complete: jest.Mock): jest.Mocked<Pick<AiGateway, "complete">> {
  return { complete } as jest.Mocked<Pick<AiGateway, "complete">>;
}

function llmResult(content: string): AiResult {
  return { content, source: "LLM", provider: "gemini", model: "gemini-2.5-flash", aiCallId: "call-1" };
}

describe("AITextNotesAnalyzer", () => {
  it("should analyze the notes through NOTES_ANALYSIS and return the call id", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));
    const analyzer: AITextNotesAnalyzer = new AITextNotesAnalyzer(gateway as unknown as AiGateway);

    const analysis: NotesAnalysis = await analyzer.analyze(NOTES, CONTEXT);

    expect(analysis).toEqual({ summary: "Resumen", keyConcepts: ["PEEP"], gaps: [], suggestions: ["Repasar"], model: "gemini-2.5-flash", aiCallId: "call-1" });
  });

  it("should send the consumer prompt with language, user and role and no fallback", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));
    const analyzer: AITextNotesAnalyzer = new AITextNotesAnalyzer(gateway as unknown as AiGateway);

    await analyzer.analyze(NOTES, CONTEXT);

    const [useCase, input, options] = gateway.complete.mock.calls[0] as [string, { userPrompt: string; language?: string }, AiCallOptions];

    expect(useCase).toBe("NOTES_ANALYSIS");
    expect(input).toEqual({ userPrompt: buildNotesAnalysisPrompt(NOTES, CONTEXT), language: "en" });
    expect(options).toEqual({ userId: "user-1", userRole: "STUDENT", refType: "notes_analysis" });
  });

  it("should propagate the unavailable error when every provider fails", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockRejectedValue(new AiProvidersUnavailableError()));
    const analyzer: AITextNotesAnalyzer = new AITextNotesAnalyzer(gateway as unknown as AiGateway);

    await expect(analyzer.analyze(NOTES, CONTEXT)).rejects.toBeInstanceOf(AiProvidersUnavailableError);
  });

  it("should reject a response that cannot be parsed into an analysis", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult("not json")));
    const analyzer: AITextNotesAnalyzer = new AITextNotesAnalyzer(gateway as unknown as AiGateway);

    await expect(analyzer.analyze(NOTES, CONTEXT)).rejects.toBeInstanceOf(NotesAnalysisInvalidResponseError);
  });
});
