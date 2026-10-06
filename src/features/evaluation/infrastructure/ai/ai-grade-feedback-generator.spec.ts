/*
 * Funcionalidad: Pruebas del generador de retroalimentación de calificación con IA
 * Descripción: Verifica que el adaptador use el generador de texto cuando está disponible y que recurra a la retroalimentación determinística si no está disponible, falla, responde vacío o con JSON inválido
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IAITextGenerator } from "@/common/application/ports/ai-text-generator.interface";
import { buildDeterministicGradeFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
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

const VALID_RESPONSE: string = JSON.stringify({ overall: "Excelente.", perQuestion: [{ questionId: "q1", feedback: "Correcto." }] });

function buildGenerator(overrides: Partial<jest.Mocked<IAITextGenerator>> = {}): jest.Mocked<IAITextGenerator> {
  return {
    isAvailable: jest.fn().mockReturnValue(true),
    generate: jest.fn().mockResolvedValue({ text: VALID_RESPONSE, model: "gemini-2.0-flash" }),
    ...overrides,
  };
}

describe("AIGradeFeedbackGenerator", () => {
  it("should return LLM feedback with provider and model when the generator answers valid JSON", async () => {
    const aiTextGenerator: jest.Mocked<IAITextGenerator> = buildGenerator();
    const generator: AIGradeFeedbackGenerator = new AIGradeFeedbackGenerator(aiTextGenerator);

    const result: GeneratedGradeFeedback = await generator.generate(CONTEXT);

    expect(result).toEqual({
      overall: "Excelente.",
      perQuestion: [{ questionId: "q1", content: "Correcto." }],
      source: "LLM",
      provider: "gemini",
      model: "gemini-2.0-flash",
    });
    expect(aiTextGenerator.generate).toHaveBeenCalledWith(expect.stringContaining("Quiz PEEP"), expect.objectContaining({ maxTokens: expect.any(Number) }));
  });

  it("should fall back without calling the generator when it is not available", async () => {
    const aiTextGenerator: jest.Mocked<IAITextGenerator> = buildGenerator({ isAvailable: jest.fn().mockReturnValue(false) });
    const generator: AIGradeFeedbackGenerator = new AIGradeFeedbackGenerator(aiTextGenerator);

    const result: GeneratedGradeFeedback = await generator.generate(CONTEXT);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
    expect(aiTextGenerator.generate).not.toHaveBeenCalled();
  });

  it("should fall back when the generator throws", async () => {
    const aiTextGenerator: jest.Mocked<IAITextGenerator> = buildGenerator({ generate: jest.fn().mockRejectedValue(new Error("quota")) });
    const generator: AIGradeFeedbackGenerator = new AIGradeFeedbackGenerator(aiTextGenerator);

    const result: GeneratedGradeFeedback = await generator.generate(CONTEXT);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
  });

  it.each(["", "   ", "not json at all"])("should fall back when the generator answers %p", async (text: string) => {
    const aiTextGenerator: jest.Mocked<IAITextGenerator> = buildGenerator({ generate: jest.fn().mockResolvedValue({ text, model: "m" }) });
    const generator: AIGradeFeedbackGenerator = new AIGradeFeedbackGenerator(aiTextGenerator);

    const result: GeneratedGradeFeedback = await generator.generate(CONTEXT);

    expect(result).toEqual(buildDeterministicGradeFeedback(CONTEXT));
  });
});
