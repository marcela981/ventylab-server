/*
 * Funcionalidad: Pruebas de AiGateway
 * Descripción: Verifica que el gateway de IA construya el prompt versionado del caso de uso, consulte la cuota antes de llamar al proveedor, registre versión y hash del prompt, no envíe correos ni nombres al proveedor (captura del payload), registre llamadas bloqueadas sin proveedor y exponga los ajustes del tutor
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IAiQuotaGuard } from "@/features/ai/application/ports/ai-quota-guard.interface";
import { type AiTutorSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { AiOrchestrator } from "@/features/ai/application/services/ai-orchestrator";
import {
  AllowAllAiQuotaGuard,
  FakeLlmProvider,
  InMemoryAiCallRecorder,
  providerRegistry,
  StaticAiSettingsProvider,
} from "@/features/ai/application/testing/ai-test-doubles-spec";
import { AiQuotaExceededError } from "@/features/ai/domain/ai.errors";
import { redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { computePromptHash } from "@/features/ai/domain/prompts/prompt-hash";
import { AI_PROMPT_TEMPLATES } from "@/features/ai/domain/prompts/prompt-registry";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";

function buildGateway(provider: FakeLlmProvider, quotaGuard: IAiQuotaGuard = new AllowAllAiQuotaGuard()): {
  gateway: AiGateway;
  recorder: InMemoryAiCallRecorder;
} {
  const settings: StaticAiSettingsProvider = new StaticAiSettingsProvider({
    providerChain: [provider.id],
    models: { [provider.id]: "fake-model" },
    timeoutMs: 1000,
    maxOutputTokens: 256,
    temperature: 0.2,
  });
  const recorder: InMemoryAiCallRecorder = new InMemoryAiCallRecorder();
  const orchestrator: AiOrchestrator = new AiOrchestrator(providerRegistry(provider), settings, recorder);

  return { gateway: new AiGateway(orchestrator, quotaGuard), recorder };
}

describe("AiGateway", () => {
  it("should build the versioned prompt, call the provider and record version and hash", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "{\"onTopic\": true}" });
    const { gateway, recorder } = buildGateway(provider);

    const result: AiResult = await gateway.complete("TOPIC_CHECK", { message: "¿Qué es la PEEP?" }, { userId: "user-1", userRole: "STUDENT" });

    expect(result).toMatchObject({ content: "{\"onTopic\": true}", source: "LLM", provider: "fake", model: "fake-model" });
    expect(provider.requests[0]).toMatchObject({ model: "fake-model", maxOutputTokens: 256, temperature: 0.2, responseFormat: "json" });
    expect(provider.requests[0].system).toContain("no reemplazan el juicio clínico");
    expect(provider.requests[0].messages[0].content).toContain("<mensaje>");
    expect(recorder.last).toMatchObject({
      promptVersion: AI_PROMPT_TEMPLATES.TOPIC_CHECK.version,
      promptHash: computePromptHash(provider.requests[0].system, provider.requests[0].messages),
      userId: "user-1",
      userRole: "STUDENT",
    });
  });

  it("should check the quota before calling any provider", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "nunca" });
    const quotaGuard: IAiQuotaGuard = {
      assertWithinQuota: jest.fn().mockRejectedValue(new AiQuotaExceededError(new Date("2026-10-06T00:00:00Z"))),
    };
    const { gateway } = buildGateway(provider, quotaGuard);

    const promise: Promise<AiResult> = gateway.complete("FREE_CHAT", { history: [], question: "hola" }, { userId: "user-1", userRole: "STUDENT" });

    await expect(promise).rejects.toBeInstanceOf(AiQuotaExceededError);
    expect(quotaGuard.assertWithinQuota).toHaveBeenCalledWith("user-1", "STUDENT", "FREE_CHAT", {
      promptVersion: AI_PROMPT_TEMPLATES.FREE_CHAT.version,
      promptHash: expect.any(String),
      refType: undefined,
      refId: undefined,
    });
    expect(provider.calls).toBe(0);
  });

  it("should never send emails or redacted names to the provider", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "ok" });
    const { gateway } = buildGateway(provider);
    const studentText: string = "Soy Ana Pérez (ana.perez@correounivalle.edu.co), ¿cómo ajusto la PEEP?";

    await gateway.complete("FREE_CHAT", {
      history: [{ role: "user", content: "Mi correo es otro.correo@gmail.com" }],
      question: redactPersonalData(studentText, ["Ana Pérez"]),
    });

    const captured: string = JSON.stringify(provider.requests);

    expect(captured).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(captured).not.toContain("Ana Pérez");
    expect(captured).toContain("¿cómo ajusto la PEEP?");
  });

  it("should stream deltas and a final result after checking the quota", async () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "stream", chunks: ["Hola", "!"] });
    const quotaGuard: AllowAllAiQuotaGuard = new AllowAllAiQuotaGuard();
    const { gateway } = buildGateway(provider, quotaGuard);
    const chunks: AiStreamChunk[] = [];

    for await (const chunk of await gateway.stream("PAGE_DEEPEN", { pageTitle: "PEEP", pageContent: "Contenido" }, { userId: "user-1" })) {
      chunks.push(chunk);
    }

    expect(quotaGuard.checks).toEqual([{ userId: "user-1", role: undefined, useCase: "PAGE_DEEPEN" }]);
    expect(chunks[chunks.length - 1]).toMatchObject({ type: "done", result: { content: "Hola!", source: "LLM" } });
  });

  it("should record a blocked off-topic call without calling any provider", () => {
    const provider: FakeLlmProvider = new FakeLlmProvider("fake", { kind: "text", text: "unused" });
    const { gateway, recorder } = buildGateway(provider);

    const aiCallId: string = gateway.recordBlocked("FREE_CHAT", { history: [], question: "¿Quién ganó el partido?" }, { userId: "user-1", userRole: "STUDENT" });

    expect(provider.calls).toBe(0);
    expect(recorder.records).toHaveLength(1);
    expect(recorder.last).toMatchObject({
      id: aiCallId,
      useCase: "FREE_CHAT",
      status: "BLOCKED_OFFTOPIC",
      errorCode: "OFF_TOPIC",
      attempts: 0,
      userId: "user-1",
      promptVersion: AI_PROMPT_TEMPLATES.FREE_CHAT.version,
    });
    expect(recorder.last?.provider).toBeUndefined();
  });

  it("should expose the tutor settings of the gateway configuration", () => {
    const { gateway } = buildGateway(new FakeLlmProvider("fake", { kind: "text", text: "unused" }));

    const settings: AiTutorSettings = gateway.getTutorSettings();

    expect(settings).toEqual({ historyWindow: 10, contextTokenBudget: 4000 });
  });
});
