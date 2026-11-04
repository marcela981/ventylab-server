/*
 * Funcionalidad: Pruebas del generador de retroalimentación de calificación con IA
 * Descripción: Verifica que el adaptador use el gateway de IA (caso GRADE_FEEDBACK, respaldo determinista, referencia al intento solo en las opciones de telemetría y nunca en el prompt) y que devuelva la retroalimentación determinística cuando el gateway usa el respaldo, falla, responde vacío o con JSON inválido; v1.3: entrada estructurada del prompt del registro, idioma del solicitante (español sin solicitante), atribución al estudiante, cuota del solicitante y nombre y correo del estudiante eliminados de sus respuestas
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallOptions, type AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type GradeFeedbackPromptInput } from "@/features/ai/domain/prompts/grade-feedback-prompt";
import { REDACTED_EMAIL, REDACTED_NAME } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type GradeFeedbackGenerationOptions } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { buildDeterministicGradeFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { type GeneratedGradeFeedback, type GradeFeedbackContext } from "@/features/evaluation/domain/value-objects/grade-feedback";
import { AIGradeFeedbackGenerator } from "@/features/evaluation/infrastructure/ai/ai-grade-feedback-generator";
import { type UsersFacade } from "@/features/users/application/services/users.facade";

const CONTEXT: GradeFeedbackContext = {
  evaluation: { type: "QUIZ", title: "Quiz PEEP" },
  grade: 5,
  passingGrade: 3,
  questions: [
    {
      questionId: "q1",
      type: "OPEN_TEXT",
      promptText: "¿PEEP inicial?",
      points: 1,
      earnedPoints: 1,
      studentAnswerText: "Soy Laura Gómez (laura.gomez@correo.co): 5 cmH2O, dice Laura",
      correctAnswerText: "5 cmH2O",
    },
  ],
};

const OPTIONS: GradeFeedbackGenerationOptions = { attemptId: "attempt-42", studentId: "student-7", requester: { userId: "teacher-1", role: "TEACHER", language: "en" } };

const VALID_RESPONSE: string = JSON.stringify({ overall: "Excelente.", perQuestion: [{ questionId: "q1", feedback: "Correcto." }] });

const USERS: UsersFacade = {
  getUserById: (id: string) => Promise.resolve(id === "student-7" ? { id, name: "Laura Gómez", email: "laura.gomez@correo.co" } : undefined),
} as unknown as UsersFacade;

function llmResult(content: string): AiResult {
  return { content, source: "LLM", provider: "openai", model: "gpt-4o-mini", aiCallId: "call-1" };
}

function buildGateway(complete: jest.Mock): jest.Mocked<Pick<AiGateway, "complete">> {
  return { complete } as jest.Mocked<Pick<AiGateway, "complete">>;
}

function buildGenerator(gateway: jest.Mocked<Pick<AiGateway, "complete">>): AIGradeFeedbackGenerator {
  return new AIGradeFeedbackGenerator(gateway as unknown as AiGateway, USERS);
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

  it("should send the structured input in the requester's language, attributed to the student with the requester's quota", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));

    await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    const [useCase, input, options] = gateway.complete.mock.calls[0] as unknown as [string, GradeFeedbackPromptInput, AiCallOptions];

    expect(useCase).toBe("GRADE_FEEDBACK");
    expect(input).toMatchObject({ evaluationType: "QUIZ", evaluationTitle: "Quiz PEEP", grade: 5, maxGrade: 5, passingGrade: 3, language: "en" });
    expect(options).toMatchObject({ userId: "student-7", quotaUserId: "teacher-1", quotaUserRole: "TEACHER", refType: "evaluation_attempt", refId: "attempt-42" });
    expect(options.userRole).toBeUndefined();
    expect(JSON.stringify(input)).not.toContain("attempt-42");
    expect(typeof options.fallback).toBe("function");
  });

  it("should remove the student's name and email from the answers sent to the provider", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));

    await buildGenerator(gateway).generate(CONTEXT, OPTIONS);

    const input: GradeFeedbackPromptInput = gateway.complete.mock.calls[0][1] as GradeFeedbackPromptInput;

    expect(input.questions[0].studentAnswerText).toBe(`Soy ${REDACTED_NAME} (${REDACTED_EMAIL}): 5 cmH2O, dice ${REDACTED_NAME}`);
  });

  it("should default to Spanish, without quota, for a system close without requester", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));

    await buildGenerator(gateway).generate(CONTEXT, { attemptId: "attempt-42", studentId: "student-7" });

    const [, input, options] = gateway.complete.mock.calls[0] as unknown as [string, GradeFeedbackPromptInput, AiCallOptions];

    expect(input.language).toBe("es");
    expect(options).toMatchObject({ userId: "student-7", quotaUserId: undefined, quotaUserRole: undefined });
  });

  it("should still redact emails when the student cannot be loaded", async () => {
    const gateway: jest.Mocked<Pick<AiGateway, "complete">> = buildGateway(jest.fn().mockResolvedValue(llmResult(VALID_RESPONSE)));
    const failingUsers: UsersFacade = { getUserById: jest.fn().mockRejectedValue(new Error("db down")) } as unknown as UsersFacade;

    await new AIGradeFeedbackGenerator(gateway as unknown as AiGateway, failingUsers).generate(CONTEXT, OPTIONS);

    expect((gateway.complete.mock.calls[0][1] as GradeFeedbackPromptInput).questions[0].studentAnswerText).toContain(REDACTED_EMAIL);
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
