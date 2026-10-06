/*
 * Funcionalidad: Pruebas del generador de retroalimentación de calificación con IA
 * Descripción: Verifica que el adaptador use el gateway de IA (caso GRADE_FEEDBACK, prompt del consumidor, respaldo determinista, sin datos de usuario, referencia al intento solo en las opciones de telemetría y nunca en el prompt) y que devuelva la retroalimentación determinística cuando el gateway usa el respaldo, falla, responde vacío o con JSON inválido
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallOptions, type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type GradeFeedbackGenerationOptions } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { buildDeterministicGradeFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { buildGradeFeedbackPrompt } from "@/features/evaluation/domain/services/grade-feedback-prompt";
import { type GeneratedGradeFeedback, type GradeFeedbackContext } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { AIGradeFeedbackGenerator } from "@/features/evaluation/infrastructure/ai/ai-grade-feedback-generator";

const CONTEXT: GradeFeedbackContext = {
  evaluation: { type: "QUIZ", title: "Quiz PEEP" },
  grade: 5,
  passingGrade: 3,
  questions: [
    {
      questionId: "q1",
      type: "SINGLE_CHOICE",
      promptText: "¿PEEP inicial?",
      points: 1,
      earnedPoints: 1,
      studentAnswerText: "5 cmH2O",
      correctAnswerText: "5 cmH2O",
    },
  ],
};

const OPTIONS: GradeFeedbackGenerationOptions = { attemptId: "attempt-42" };

const VALID_RESPONSE: string = JSON.stringify({ overall: "Excelente.", perQuestion: [{ questionId: "q1", feedback: "Correcto." }] });

function llmResult(content: string): AiResult {
  return { content, source: "LLM", provider: "openai", model: "gpt-4o-mini", aiCallId: "call-1" };
}

function buildGateway(complete: jest.Mock): jest.Mocked<Pick<AiGateway, "complete">> {
  return { complete } as jest.Mocked<Pick<AiGateway, "complete">>;
}

function buildGenerator(gateway: jest.Mocked<Pick<AiGateway, "complete">>): AIGradeFeedbackGenerator {
  return new AIGradeFeedbackGenerator(gateway as unknown as AiGateway);
}

describe("AIGradeFeedbackGenerator", () => {
  it("should return LLM feedback with the provider and model reported by the gateway", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));

    const result: GeneratedGradeFeedback = await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    expect(result).toEqual({
      overall: "Excelente.",
      perQuestion: [{ questionId: "q1", content: "Correcto." }],
      source: "LLM",
      provider: "openai",
      model: "gpt-4o-mini",
    });
  });

  it("should call GRADE_FEEDBACK with the consumer prompt, a deterministic fallback and no user data", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));

    await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    const [useCase, input, options] = gateway.complete.mock.calls[0] as [string, { userPrompt: string; language?: string }, AiCallOptions];

    expect(useCase).toBe("GRADE_FEEDBACK");
    expect(input).toEqual({ userPrompt: buildGradeFeedbackPrompt(CONTEXT), language: "es" });
    expect(options.userId).toBeUndefined();
    expect(options.userRole).toBeUndefined();
    expect(options.refType).toBe("evaluation_attempt");
    expect(options.refId).toBe("attempt-42");
    expect(input.userPrompt).not.toContain("attempt-42");
    expect(typeof options.fallback).toBe("function");
  });

  it("should return the deterministic feedback when the gateway answers with its fallback", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(
      jest.fn().mockImplementation(async (_useCase: string, _input: unknown, options: AiCallOptions) => ({
        content: await options.fallback?.(),
        source: "DETERMINISTIC",
        aiCallId: "call-2",
      })),
    );

    const result: GeneratedGradeFeedback = await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
  });

  it("should fall back when the gateway throws", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockRejectedValue(new Error("boom")));

    const result: GeneratedGradeFeedback = await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
  });

  it.each(["", "   ", "not json at all"])("should fall back when the gateway answers %p", async (text: string) => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(text)));

    const result: GeneratedGradeFeedback = await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
  });
});
