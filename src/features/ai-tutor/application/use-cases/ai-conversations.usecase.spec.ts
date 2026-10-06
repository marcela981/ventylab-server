/*
 * Funcionalidad: Pruebas de las conversaciones del tutor
 * Descripción: Verifica el chat libre con verificación de tema (rechazo fijo persistido y BLOCKED_OFFTOPIC sin llamar a FREE_CHAT, chequeo 9; respaldo por lista de términos ante respuesta inválida), la cancelación a mitad del stream (ABORTED y respuesta parcial incompleta, chequeo 11), el aislamiento por dueño (404, chequeo 12), que el payload enviado al proveedor no lleve correo ni nombre (chequeo 13), el contexto de lección por prioridad y presupuesto, la ventana de historial y el CRUD de conversaciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import { type AiCallRecord } from "@/features/ai/application/ports/ai-call-recorder.interface";
import { FakeLlmProvider } from "@/features/ai/application/testing/ai-test-doubles-spec";
import { RenameAiConversationCommand } from "@/features/ai-tutor/application/commands/rename-ai-conversation.command";
import { SendAiConversationMessageCommand } from "@/features/ai-tutor/application/commands/send-ai-conversation-message.command";
import { StartAiConversationCommand } from "@/features/ai-tutor/application/commands/start-ai-conversation.command";
import { AiConversationDetailResult } from "@/features/ai-tutor/application/results/ai-conversation-detail.result";
import { type TutorStreamEvent, type TutorStreamResult } from "@/features/ai-tutor/application/results/tutor-stream.result";
import {
  buildTutorHarness,
  collectEvents,
  STUDENT_CALLER,
  type TutorHarness,
} from "@/features/ai-tutor/application/testing/ai-tutor-test-doubles-spec";
import { DeleteAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/delete-ai-conversation.usecase";
import { GetAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversation.usecase";
import { GetAiConversationsUseCase } from "@/features/ai-tutor/application/use-cases/get-ai-conversations.usecase";
import { RenameAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/rename-ai-conversation.usecase";
import { SendAiConversationMessageUseCase } from "@/features/ai-tutor/application/use-cases/send-ai-conversation-message.usecase";
import { StartAiConversationUseCase } from "@/features/ai-tutor/application/use-cases/start-ai-conversation.usecase";
import { AiConversationNotFoundError, AiConversationRefRequiredError } from "@/features/ai-tutor/domain/ai-tutor.errors";
import { AiConversation } from "@/features/ai-tutor/domain/entities/ai-conversation.entity";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { OFF_TOPIC_REPLY } from "@/features/ai-tutor/domain/services/topic-guard";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";

const EMAIL_PATTERN: RegExp = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

function useCases(harness: TutorHarness): { start: StartAiConversationUseCase; send: SendAiConversationMessageUseCase } {
  return {
    start: new StartAiConversationUseCase(harness.turns),
    send: new SendAiConversationMessageUseCase(harness.repository, harness.turns),
  };
}

function seedCurriculum(harness: TutorHarness): void {
  harness.reader.pages = [
    { id: "p-current", title: "Actual", text: "CURRENT ".repeat(10), moduleId: "m-1", moduleTitle: "Módulo uno", lessonId: "l-1", lessonTitle: "Lección uno", published: true },
    { id: "p-other", title: "Otra", text: "OTHER ".repeat(10), moduleId: "m-1", moduleTitle: "Módulo uno", lessonId: "l-1", lessonTitle: "Lección uno", published: true },
    { id: "p-draft", title: "Borrador", text: "DRAFT ".repeat(10), moduleId: "m-1", moduleTitle: "Módulo uno", lessonId: "l-1", lessonTitle: "Lección uno", published: false },
  ];
  harness.reader.lessons = [
    { id: "l-1", title: "Lección uno", moduleId: "m-1", pageIds: ["p-other", "p-draft", "p-current"], published: true },
    { id: "l-draft", title: "Lección borrador", moduleId: "m-1", pageIds: [], published: false },
  ];
  harness.reader.modules = [
    { id: "m-1", title: "Módulo uno", description: "MODULE SUMMARY", lessonTitles: ["Lección uno"], pageIds: ["p-current", "p-other"], published: true },
  ];
}

describe("AI tutor conversations", () => {
  it("should refuse an off-topic free chat message with the fixed reply, record BLOCKED_OFFTOPIC and never call FREE_CHAT (check 9)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", [{ kind: "text", text: "{\"onTopic\": false}" }, { kind: "stream", chunks: ["unused"] }]);
    const harness: TutorHarness = buildTutorHarness(provider);
    const { start } = useCases(harness);

    const result: TutorStreamResult = await start.execute(
      new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "FREE", message: "¿Quién ganó el partido de fútbol?" }),
    );
    const events: TutorStreamEvent[] = await collectEvents(result.events);

    const messages: AiConversationMessage[] = harness.repository.messagesOf(result.conversationId);
    const blocked: AiCallRecord | undefined = harness.recorder.records.find((record: AiCallRecord) => record.status === "BLOCKED_OFFTOPIC");

    expect(provider.calls).toBe(1);
    expect(harness.recorder.records.map((record: AiCallRecord) => record.useCase)).toEqual(["TOPIC_CHECK", "FREE_CHAT"]);
    expect(blocked).toMatchObject({ useCase: "FREE_CHAT", attempts: 0, userId: STUDENT_CALLER.userId });
    expect(events).toEqual([
      { type: "delta", text: OFF_TOPIC_REPLY },
      { type: "done", aiCallId: blocked?.id, messageId: messages[1].id, conversationId: result.conversationId },
    ]);
    expect(messages.map((message: AiConversationMessage) => [message.role, message.content])).toEqual([
      ["USER", "¿Quién ganó el partido de fútbol?"],
      ["ASSISTANT", OFF_TOPIC_REPLY],
    ]);
  });

  it("should fall back to the term list when TOPIC_CHECK answers malformed JSON and stream FREE_CHAT when on topic", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", [{ kind: "text", text: "claro que sí" }, { kind: "stream", chunks: ["La PEEP ", "es..."] }]);
    const harness: TutorHarness = buildTutorHarness(provider);
    const { start } = useCases(harness);

    const result: TutorStreamResult = await start.execute(new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "FREE", message: "¿Qué es la PEEP?" }));
    await collectEvents(result.events);

    expect(provider.calls).toBe(2);
    expect(provider.requests[1].system).toContain("solo sobre ventilación mecánica");
    expect(harness.repository.messagesOf(result.conversationId)[1]).toMatchObject({ role: "ASSISTANT", content: "La PEEP es...", isIncomplete: false });
  });

  it("should persist the partial answer as incomplete and record ABORTED when the client disconnects mid-stream (check 11)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["Primera parte", " segunda", " tercera"], chunkDelayMs: 20 });
    const harness: TutorHarness = buildTutorHarness(provider);
    const conversation: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "PAGE", refId: "p-current", firstMessage: "Hola" });
    const controller: AbortController = new AbortController();
    const received: TutorStreamEvent[] = [];
    const { send } = useCases(harness);

    seedCurriculum(harness);
    await harness.repository.save(conversation);

    const result: TutorStreamResult = await send.execute(
      new SendAiConversationMessageCommand({ caller: STUDENT_CALLER, conversationId: conversation.id, message: "Explícame más", signal: controller.signal }),
    );

    for await (const event of result.events) {
      received.push(event);

      if (event.type === "delta") {
        controller.abort();
      }
    }

    const assistant: AiConversationMessage | undefined = harness.repository
      .messagesOf(conversation.id)
      .find((message: AiConversationMessage) => message.role === "ASSISTANT");

    expect(received).toEqual([{ type: "delta", text: "Primera parte" }]);
    expect(harness.recorder.last).toMatchObject({ useCase: "LESSON_QA", status: "ABORTED", refType: "ai_message", refId: assistant?.id });
    expect(assistant).toMatchObject({ content: "Primera parte", isIncomplete: true });
  });

  it("should never send the user's email or name to the provider (check 13)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", [
      { kind: "text", text: "{\"onTopic\": true}" },
      { kind: "stream", chunks: ["Respuesta"] },
    ]);
    const harness: TutorHarness = buildTutorHarness(provider, { names: ["Ana Pérez", "Ana", "Pérez"] });
    const conversation: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "FREE", firstMessage: "Hola" });
    const { send } = useCases(harness);

    await harness.repository.save(conversation);
    await harness.repository.addMessage({ id: "m-1", conversationId: conversation.id, role: "USER", content: "Me llamo Ana Pérez", isIncomplete: false });
    await harness.repository.addMessage({ id: "m-2", conversationId: conversation.id, role: "ASSISTANT", content: "Hola", isIncomplete: false });

    const result: TutorStreamResult = await send.execute(
      new SendAiConversationMessageCommand({
        caller: STUDENT_CALLER,
        conversationId: conversation.id,
        message: "Soy Ana Pérez (ana.perez@correounivalle.edu.co), Ana para los amigos; ¿cómo ajusto la PEEP según la anatomía?",
      }),
    );
    await collectEvents(result.events);

    const payload: string = JSON.stringify(provider.requests);

    expect(provider.calls).toBe(2);
    expect(payload).not.toMatch(EMAIL_PATTERN);
    expect(payload).not.toContain("Ana Pérez");
    expect(payload).not.toMatch(/(?<!\p{L})(Ana|Pérez)(?!\p{L})/u);
    expect(payload).toContain("anatomía");
    expect(payload).not.toContain(STUDENT_CALLER.userId);
    expect(payload).toContain("¿cómo ajusto la PEEP según la anatomía?");
  });

  it("should build the lesson context with the current page first, then the lesson pages and the module summary, hiding drafts", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["ok"] });
    const harness: TutorHarness = buildTutorHarness(provider);
    const { start } = useCases(harness);

    seedCurriculum(harness);

    const result: TutorStreamResult = await start.execute(
      new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "LESSON", refId: "l-1", message: "Resume la lección", currentPageId: "p-current" }),
    );
    await collectEvents(result.events);

    const system: string = provider.requests[0].system;

    expect(system).toContain("Lección uno");
    expect(system.indexOf("CURRENT")).toBeLessThan(system.indexOf("OTHER"));
    expect(system.indexOf("OTHER")).toBeLessThan(system.indexOf("MODULE SUMMARY"));
    expect(system).not.toContain("DRAFT");
    expect(harness.repository.conversations.get(result.conversationId)).toMatchObject({ scope: "LESSON", refId: "l-1" });
  });

  it("should cut the lesson context at the configured token budget, keeping the current page", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["ok"] });
    const harness: TutorHarness = buildTutorHarness(provider, { contextTokenBudget: 30 });
    const { start } = useCases(harness);

    seedCurriculum(harness);

    const result: TutorStreamResult = await start.execute(
      new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "LESSON", refId: "l-1", message: "Resume", currentPageId: "p-current" }),
    );
    await collectEvents(result.events);

    const system: string = provider.requests[0].system;

    expect(system).toContain("CURRENT");
    expect(system).not.toContain("MODULE SUMMARY");
  });

  it("should reject lesson conversations without a reference or on a draft lesson for students before persisting", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["unused"] });
    const harness: TutorHarness = buildTutorHarness(provider);
    const { start } = useCases(harness);

    seedCurriculum(harness);

    await expect(start.execute(new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "LESSON", message: "Hola" }))).rejects.toBeInstanceOf(
      AiConversationRefRequiredError,
    );
    await expect(
      start.execute(new StartAiConversationCommand({ caller: STUDENT_CALLER, scope: "LESSON", refId: "l-draft", message: "Hola" })),
    ).rejects.toBeInstanceOf(LessonNotFoundError);
    expect(provider.calls).toBe(0);
    expect(harness.repository.conversations.size).toBe(0);
  });

  it("should send only the configured history window to the model", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", [{ kind: "text", text: "{\"onTopic\": true}" }, { kind: "stream", chunks: ["ok"] }]);
    const harness: TutorHarness = buildTutorHarness(provider);
    const conversation: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "FREE", firstMessage: "q0" });
    const { send } = useCases(harness);

    await harness.repository.save(conversation);

    for (let index: number = 0; index < 6; index++) {
      await harness.repository.addMessage({
        id: `m-${index}`,
        conversationId: conversation.id,
        role: index % 2 === 0 ? "USER" : "ASSISTANT",
        content: `turn-${index}`,
        isIncomplete: false,
      });
    }

    const result: TutorStreamResult = await send.execute(
      new SendAiConversationMessageCommand({ caller: STUDENT_CALLER, conversationId: conversation.id, message: "¿Y la PEEP?" }),
    );
    await collectEvents(result.events);

    const contents: string[] = provider.requests[1].messages.map((message: { content: string }) => message.content);

    expect(contents).toEqual(["turn-2", "turn-3", "turn-4", "turn-5", "¿Y la PEEP?"]);
  });

  it("should answer 404 for another user's conversation on every route (check 12)", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["unused"] });
    const harness: TutorHarness = buildTutorHarness(provider);
    const foreign: AiConversation = AiConversation.start({ userId: "someone-else", scope: "FREE", firstMessage: "Privado" });
    const { send } = useCases(harness);

    await harness.repository.save(foreign);

    await expect(
      send.execute(new SendAiConversationMessageCommand({ caller: STUDENT_CALLER, conversationId: foreign.id, message: "Hola" })),
    ).rejects.toBeInstanceOf(AiConversationNotFoundError);
    await expect(new GetAiConversationUseCase(harness.repository).execute(foreign.id, STUDENT_CALLER.userId)).rejects.toBeInstanceOf(AiConversationNotFoundError);
    await expect(
      new RenameAiConversationUseCase(harness.repository).execute(
        new RenameAiConversationCommand({ userId: STUDENT_CALLER.userId, conversationId: foreign.id, title: "Mío" }),
      ),
    ).rejects.toBeInstanceOf(AiConversationNotFoundError);
    await expect(new DeleteAiConversationUseCase(harness.repository).execute(foreign.id, STUDENT_CALLER.userId)).rejects.toBeInstanceOf(
      AiConversationNotFoundError,
    );
    expect(harness.repository.conversations.get(foreign.id)?.title).toBe("Privado");
    expect(provider.calls).toBe(0);
  });

  it("should list, read, rename and delete the caller's own conversations", async () => {
    const harness: TutorHarness = buildTutorHarness(new FakeLlmProvider("fake", { kind: "text", text: "unused" }));
    const own: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "LESSON", refId: "l-1", firstMessage: "Pregunta" });
    const free: AiConversation = AiConversation.start({ userId: STUDENT_CALLER.userId, scope: "FREE", firstMessage: "Libre" });

    await Promise.all([harness.repository.save(own), harness.repository.save(free)]);
    await harness.repository.addMessage({ id: "m-1", conversationId: own.id, role: "USER", content: "Pregunta", isIncomplete: false });

    const lessons: Paginated<AiConversation> = await new GetAiConversationsUseCase(harness.repository).execute({
      userId: STUDENT_CALLER.userId,
      scope: "LESSON",
      page: 1,
      limit: 10,
    });
    const detail: AiConversationDetailResult = await new GetAiConversationUseCase(harness.repository).execute(own.id, STUDENT_CALLER.userId);

    await new RenameAiConversationUseCase(harness.repository).execute(
      new RenameAiConversationCommand({ userId: STUDENT_CALLER.userId, conversationId: own.id, title: "  Ventilación   protectora " }),
    );
    await new DeleteAiConversationUseCase(harness.repository).execute(free.id, STUDENT_CALLER.userId);

    expect(lessons.data.map((conversation: AiConversation) => conversation.id)).toEqual([own.id]);
    expect(detail.messages.map((message: AiConversationMessage) => message.content)).toEqual(["Pregunta"]);
    expect(harness.repository.conversations.get(own.id)?.title).toBe("Ventilación protectora");
    expect(harness.repository.conversations.has(free.id)).toBe(false);
  });
});
