/*
 * Funcionalidad: Gateway de IA
 * Descripción: Fachada pública de la feature ai: construye el prompt versionado del caso de uso, elimina correos del contenido saliente, calcula su hash, verifica la cuota del usuario (con versión y hash para registrar el rechazo) y delega en AiOrchestrator para completar o transmitir la respuesta con respaldo determinista opcional; registra sin llamar a ningún proveedor ni consultar la cuota las llamadas que el consumidor bloquea por estar fuera de tema, expone los ajustes del tutor (ventana de historial y presupuesto de contexto), la salud de solo lectura de cada proveedor (sin llamar a ninguno) y la sonda manual de un proveedor con el prompt mínimo versionado, sin cuota y registrada en la telemetría con la referencia health_probe
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AI_QUOTA_GUARD_TOKEN, type IAiQuotaGuard } from "@/features/ai/application/ports/ai-quota-guard.interface";
import { type AiTutorSettings } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { type AiCallOptions, AiOrchestrator, type AiOrchestrationRequest } from "@/features/ai/application/services/ai-orchestrator";
import { UnknownAiProviderError } from "@/features/ai/domain/ai.errors";
import {
  HEALTH_PROBE_MAX_OUTPUT_TOKENS,
  HEALTH_PROBE_PROMPT,
  HEALTH_PROBE_PROMPT_VERSION,
  HEALTH_PROBE_REF_TYPE,
  HEALTH_PROBE_TIMEOUT_MS,
  HEALTH_PROBE_USE_CASE,
} from "@/features/ai/domain/prompts/health-probe-prompt";
import { stripEmails } from "@/features/ai/domain/prompts/personal-data-guard";
import { computePromptHash } from "@/features/ai/domain/prompts/prompt-hash";
import { type AiPromptInputs, getPromptTemplate } from "@/features/ai/domain/prompts/prompt-registry";
import { type AiMessage, type BuiltPrompt, type PromptTemplate } from "@/features/ai/domain/prompts/prompt-template";
import { type AiProbeResult, type AiProviderHealth } from "@/features/ai/domain/results/ai-provider-health";
import { type AiResult, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { isKnownAiProviderId } from "@/features/ai/domain/value-objects/ai-provider-id";
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export { type AiCallOptions } from "@/features/ai/application/services/ai-orchestrator";

@Injectable()
export class AiGateway {
  public constructor(
    private readonly _orchestrator: AiOrchestrator,
    @Inject(AI_QUOTA_GUARD_TOKEN)
    private readonly _quotaGuard: IAiQuotaGuard,
  ) {}

  public async complete<U extends AiUseCaseValue>(useCase: U, input: AiPromptInputs[U], options: AiCallOptions = {}): Promise<AiResult> {
    const request: AiOrchestrationRequest = this._prepare(useCase, input, options);

    await this._assertWithinQuota(request);

    return await this._orchestrator.complete(request);
  }

  public async stream<U extends AiUseCaseValue>(useCase: U, input: AiPromptInputs[U], options: AiCallOptions = {}): Promise<AsyncIterable<AiStreamChunk>> {
    const request: AiOrchestrationRequest = this._prepare(useCase, input, options);

    await this._assertWithinQuota(request);

    return this._orchestrator.stream(request);
  }

  public getTutorSettings(): AiTutorSettings {
    return this._orchestrator.getTutorSettings();
  }

  public getProviderHealth(): AiProviderHealth[] {
    return this._orchestrator.getProviderHealth();
  }

  public async probe(providerId: string): Promise<AiProbeResult> {
    if (!isKnownAiProviderId(providerId)) {
      throw new UnknownAiProviderError(providerId);
    }

    const prompt: BuiltPrompt = HEALTH_PROBE_PROMPT;
    const request: AiOrchestrationRequest = {
      useCase: HEALTH_PROBE_USE_CASE,
      prompt,
      promptVersion: HEALTH_PROBE_PROMPT_VERSION,
      promptHash: computePromptHash(prompt.system, prompt.messages),
      options: { refType: HEALTH_PROBE_REF_TYPE, refId: providerId },
    };

    return await this._orchestrator.probe(request, providerId, { timeoutMs: HEALTH_PROBE_TIMEOUT_MS, maxOutputTokens: HEALTH_PROBE_MAX_OUTPUT_TOKENS });
  }

  public recordBlocked<U extends AiUseCaseValue>(useCase: U, input: AiPromptInputs[U], options: AiCallOptions = {}): string {
    return this._orchestrator.recordBlocked(this._prepare(useCase, input, options));
  }

  private async _assertWithinQuota(request: AiOrchestrationRequest): Promise<void> {
    const { options } = request;

    await this._quotaGuard.assertWithinQuota(options.userId, options.userRole, request.useCase, {
      promptVersion: request.promptVersion,
      promptHash: request.promptHash,
      refType: options.refType,
      refId: options.refId,
    });
  }

  private _prepare<U extends AiUseCaseValue>(useCase: U, input: AiPromptInputs[U], options: AiCallOptions): AiOrchestrationRequest {
    const template: PromptTemplate<AiPromptInputs[U]> = getPromptTemplate(useCase);
    const built: BuiltPrompt = template.build(input);
    const prompt: BuiltPrompt = {
      system: stripEmails(built.system),
      messages: built.messages.map((message: AiMessage) => ({ role: message.role, content: stripEmails(message.content) })),
      responseFormat: built.responseFormat,
    };

    return {
      useCase,
      prompt,
      promptVersion: template.version,
      promptHash: computePromptHash(prompt.system, prompt.messages),
      options,
    };
  }
}
