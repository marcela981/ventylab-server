/*
 * Funcionalidad: Adaptador GeminiAITextGenerator
 * Descripción: Implementa IAITextGenerator con Google Gemini (@google/generative-ai) usando GEMINI_API_KEY
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GoogleGenerativeAI, type GenerateContentResult, type GenerativeModel } from "@google/generative-ai";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  type AITextGenerationOptions,
  type AITextGenerationResult,
  type IAITextGenerator,
} from "@/common/application/ports/ai-text-generator.interface";
import { AIGenerationFailedError } from "@/common/domain/errors/ai-generation-failed.error";
import { AIUnavailableError } from "@/common/domain/errors/ai-unavailable.error";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

const GEMINI_MODELS: readonly string[] = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.0-pro",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
] as const;

const DEFAULT_TEMPERATURE: number = 0.7;
const DEFAULT_MAX_TOKENS: number = 2048;
const PREFERRED_MODEL_MAX_ATTEMPTS: number = 3;
const FALLBACK_MODEL_MAX_ATTEMPTS: number = 1;
const REQUEST_TIMEOUT_MS: number = 30000;
const RETRY_BASE_DELAY_MS: number = 1000;

@Injectable()
export class GeminiAITextGenerator implements IAITextGenerator {
  private readonly _logger: Logger = new Logger(GeminiAITextGenerator.name);
  private readonly _client: GoogleGenerativeAI | null;
  private _preferredModel: string = GEMINI_MODELS[0];

  public constructor(configService: ConfigService<EnvironmentVariables, true>) {
    const apiKey: string | undefined = configService.get("GEMINI_API_KEY", { infer: true });

    this._client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

    if (!this._client) {
      this._logger.warn("GEMINI_API_KEY is not set; AI text generation is disabled");
    }
  }

  public isAvailable(): boolean {
    return this._client !== null;
  }

  public async generate(prompt: string, options: AITextGenerationOptions = {}): Promise<AITextGenerationResult> {
    const client: GoogleGenerativeAI | null = this._client;

    if (!client) {
      throw new AIUnavailableError();
    }

    const models: string[] = [this._preferredModel, ...GEMINI_MODELS.filter((model: string) => model !== this._preferredModel)];

    for (const [index, modelName] of models.entries()) {
      const model: GenerativeModel = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          maxOutputTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        },
      });

      const maxAttempts: number = index === 0 ? PREFERRED_MODEL_MAX_ATTEMPTS : FALLBACK_MODEL_MAX_ATTEMPTS;
      const text: string | null = await this._generateWithRetries(model, modelName, prompt, maxAttempts);

      if (text !== null) {
        this._preferredModel = modelName;

        return { text, model: modelName };
      }
    }

    throw new AIGenerationFailedError();
  }

  private async _generateWithRetries(
    model: GenerativeModel,
    modelName: string,
    prompt: string,
    maxAttempts: number,
  ): Promise<string | null> {
    for (let attempt: number = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result: GenerateContentResult = await this._withTimeout(model.generateContent(prompt));

        return result.response.text();
      } catch (error: unknown) {
        this._logger.warn(`Gemini model ${modelName} failed (attempt ${attempt}/${maxAttempts})`, { error });

        if (attempt < maxAttempts) {
          await this._delay(RETRY_BASE_DELAY_MS * attempt);
        }
      }
    }

    return null;
  }

  private async _withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeout: Promise<never> = new Promise<never>((_resolve: (value: never) => void, reject: (reason: Error) => void) => {
      timeoutHandle = setTimeout(() => reject(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async _delay(ms: number): Promise<void> {
    await new Promise<void>((resolve: () => void) => setTimeout(resolve, ms));
  }
}
