/*
 * Funcionalidad: Pruebas de DeepenPageUseCase
 * Descripción: Verifica la profundización de páginas con el tutor: página en borrador como estudiante responde 404 sin llamar al modelo (chequeo 10), contexto con títulos de lección y módulo y fragmentos de la fuente de conocimiento, persistencia de la conversación de página y de la respuesta completa con aiCallId, TTFT registrado una sola vez por stream (chequeo 16) y reutilización de una conversación de página
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallRecord } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";
import { DeepenPageCommand } from "@/features/ai-tutor/application/commands/deepen-page.command";
import { type TutorStreamEvent, type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import {
  buildTutorHarness,
  collectEvents,
  STUDENT_CALLER,
  TEACHER_CALLER,
  type TutorHarness,
} from "@/features/ai-tutor/application/testing/ai-tutor-test-doubles-spec";
import { DeepenPageUseCase } from "@/features/ai-tutor/application/use-cases/deepen-page.usecase";
import { AiConversationNotFoundError, AiConversationPageMismatchError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { PageNotFoundError } from "@/features/pages/domain/pages.errors";

function setup(provider: FakeLlmProvider, harness: TutorHarness = buildTutorHarness(provider)): { harness: TutorHarness; useCase: DeepenPageUseCase } {
  harness.reader.pages = [
    {
      id: "page-1",
      title: "Presión positiva al final de la espiración",
      text: "La PEEP mantiene los alvéolos abiertos al final de la espiración.",
      moduleId: "module-1",
      moduleTitle: "Fundamentos de ventilación",
      lessonId: "lesson-1",
      lessonTitle: "Parámetros básicos",
      published: true,
    },
    {
      id: "draft-page",
      title: "Borrador",
      text: "Contenido no publicado",
      moduleId: "module-1",
      moduleTitle: "Fundamentos de ventilación",
      published: false,
    },
  ];

  return { harness, useCase: new DeepenPageUseCase(harness.reader, harness.repository, harness.assembler, harness.turns) };
}

describe("DeepenPageUseCase", () => {
  it("should answer 404 for a draft page as a student without calling the model or persisting anything (check 10)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["unused"] });
    const { harness, useCase } = setup(provider);

    const execution: Promise<TutorStreamResult> = useCase.execute(new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "draft-page" }));

    await expect(execution).rejects.toBeInstanceOf(PageNotFoundError);
    expect(provider.calls).toBe(0);
    expect(harness.recorder.records).toHaveLength(0);
    expect(harness.repository.conversations.size).toBe(0);
  });

  it("should let a teacher deepen a draft page", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["Detalle"] });
    const { useCase } = setup(provider);

    const result: TutorStreamResult = await useCase.execute(new DeepenPageCommand({ caller: TEACHER_CALLER, pageId: "draft-page" }));
    const events: TutorStreamEvent[] = await collectEvents(result.events);

    expect(events[events.length - 1]).toMatchObject({ type: "done", conversationId: result.conversationId });
  });

  it("should stream the answer with page, lesson, module and knowledge context and persist the page conversation", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["La PEEP ", "evita el colapso."] });
    const harness: TutorHarness = buildTutorHarness(provider, { fragments: [{ text: "Guía SDRA: PEEP alta", sourceRef: "guia-sdra" }] });
    const { useCase } = setup(provider, harness);

    const result: TutorStreamResult = await useCase.execute(
      new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "page-1", question: "¿Cuándo subir la PEEP?" }),
    );
    const events: TutorStreamEvent[] = await collectEvents(result.events);

    const prompt: string = provider.requests[0].messages[0].content;
    const messages: AiConversationMessage[] = harness.repository.messagesOf(result.conversationId);
    const done: TutorStreamEvent | undefined = events.find((event: TutorStreamEvent) => event.type === "done");

    expect(events.filter((event: TutorStreamEvent) => event.type === "delta").map((event: TutorStreamEvent) => (event.type === "delta" ? event.text : ""))).toEqual([
      "La PEEP ",
      "evita el colapso.",
    ]);
    expect(prompt).toContain("Presión positiva al final de la espiración");
    expect(prompt).toContain("Parámetros básicos");
    expect(prompt).toContain("Fundamentos de ventilación");
    expect(prompt).toContain("La PEEP mantiene los alvéolos abiertos");
    expect(prompt).toContain("Guía SDRA: PEEP alta");
    expect(prompt).toContain("¿Cuándo subir la PEEP?");
    expect(harness.repository.conversations.get(result.conversationId)).toMatchObject({ scope: "PAGE", refId: "page-1", title: "¿Cuándo subir la PEEP?" });
    expect(messages.map((message: AiConversationMessage) => [message.role, message.content, message.isIncomplete])).toEqual([
      ["USER", "¿Cuándo subir la PEEP?", false],
      ["ASSISTANT", "La PEEP evita el colapso.", false],
    ]);
    expect(done).toEqual({ type: "done", aiCallId: messages[1].aiCallId, messageId: messages[1].id, conversationId: result.conversationId });
  });

  it("should record exactly one telemetry entry with TTFT for the streamed call (check 16)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["a", "b", "c"], chunkDelayMs: 5 });
    const { harness, useCase } = setup(provider);

    const result: TutorStreamResult = await useCase.execute(new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "page-1" }));
    await collectEvents(result.events);

    const records: AiCallRecord[] = harness.recorder.records.filter((record: AiCallRecord) => record.useCase === "PAGE_DEEPEN");

    expect(records).toHaveLength(1);
    expect(records[0].status).toBe("SUCCESS");
    expect(records[0].ttftMs).toEqual(expect.any(Number));
    expect(records[0].ttftMs).toBeGreaterThanOrEqual(0);
    expect(records[0].refType).toBe("ai_message");
  });

  it("should append to an owned page conversation and reject another page or another user's conversation", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["ok"] });
    const { harness, useCase } = setup(provider);
    const own: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "PAGE", refId: "page-1", firstMessage: "Hola" });
    const otherPage: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "PAGE", refId: "page-2", firstMessage: "Hola" });
    const foreign: AiConversation = AiConversation.start({ userId: "someone-else", scope: "PAGE", refId: "page-1", firstMessage: "Hola" });

    await Promise.all([harness.repository.save(own), harness.repository.save(otherPage), harness.repository.save(foreign)]);

    const result: TutorStreamResult = await useCase.execute(new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "page-1", conversationId: own.id }));
    await collectEvents(result.events);

    expect(result.conversationId).toBe(own.id);
    await expect(useCase.execute(new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "page-1", conversationId: otherPage.id }))).rejects.toBeInstanceOf(
      AiConversationPageMismatchError,
    );
    await expect(useCase.execute(new DeepenPageCommand({ caller: STUDENT_CALLER, pageId: "page-1", conversationId: foreign.id }))).rejects.toBeInstanceOf(
      AiConversationNotFoundError,
    );
  });
});
