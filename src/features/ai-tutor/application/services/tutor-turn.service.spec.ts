/*
 * Funcionalidad: Pruebas del servicio de turnos del tutor
 * Descripción: Verifica que el chat libre omite TOPIC_CHECK cuando la verificación de tema está desactivada en los ajustes del tutor y que la ejecuta cuando está activa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallRecord } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";
import { type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { buildTutorHarness, collectEvents, STUDENT_CALLER, type TutorHarness } from "@/features/ai-tutor/application/testing/ai-tutor-test-doubles-spec";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { FREE_CONVERSATION_SCOPE } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

const QUESTION: string = "¿Quién ganó el partido de fútbol?";

async function answerFreeChat(harness: TutorHarness): Promise<string[]> {
  const conversation: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: FREE_CONVERSATION_SCOPE, firstMessage: QUESTION });
  const result: TutorStreamResult = await harness.turns.answerConversation({ conversation, isNewConversation: true, message: QUESTION, caller: STUDENT_CALLER });

  await collectEvents(result.events);

  return harness.recorder.records.map((record: AiCallRecord): string => record.useCase);
}

describe("TutorTurnService topic check", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("skips TOPIC_CHECK and answers with FREE_CHAT when the topic check is disabled", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["answer"] });
    const harness: TutorHarness = buildTutorHarness(provider);

    jest.spyOn(harness.gateway, "getTutorSettings").mockReturnValue({ historyWindow: 4, contextTokenBudget: 4000, topicCheckEnabled: false });

    const useCases: string[] = await answerFreeChat(harness);

    expect(useCases).toEqual(["FREE_CHAT"]);
    expect(provider.calls).toBe(1);
  });

  it("runs TOPIC_CHECK before FREE_CHAT when the topic check is enabled", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", [{ kind: "text", text: "{\"onTopic\": false}" }, { kind: "stream", chunks: ["unused"] }]);
    const harness: TutorHarness = buildTutorHarness(provider);

    jest.spyOn(harness.gateway, "getTutorSettings").mockReturnValue({ historyWindow: 4, contextTokenBudget: 4000, topicCheckEnabled: true });

    const useCases: string[] = await answerFreeChat(harness);

    expect(useCases).toEqual(["TOPIC_CHECK", "FREE_CHAT"]);
    expect(provider.calls).toBe(1);
  });
});
