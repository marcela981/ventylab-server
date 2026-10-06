/*
 * Funcionalidad: Generador de retroalimentación de calificación con IA
 * Descripción: Implementa IGradeFeedbackGenerator sobre el generador de texto compartido (Gemini); si el modelo no está disponible, falla o responde algo no interpretable, devuelve la retroalimentación determinística. Solo registra el nombre del error, nunca el prompt ni las respuestas del estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  AI_TEXT_GENERATOR_TOKEN,
  type AITextGenerationResult,
  type IAITextGenerator,
} from "@/common/application/ports/ai-text-generator.interface";
import { type IGradeFeedbackGenerator } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { buildDeterministicGradeFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { buildGradeFeedbackPrompt, parseGradeFeedbackResponse } from "@/features/evaluation/domain/services/grade-feedback-prompt";
import {
  type GeneratedGradeFeedback,
  type GradeFeedbackContent,
  type GradeFeedbackContext,
  LLM_FEEDBACK_SOURCE,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

export const GRADE_FEEDBACK_AI_PROVIDER: string = "gemini";
const GRADE_FEEDBACK_TEMPERATURE: number = 0.4;
const GRADE_FEEDBACK_MAX_TOKENS: number = 3000;

@Injectable()
export class AIGradeFeedbackGenerator implements IGradeFeedbackGenerator {
  private readonly _logger: Logger = new Logger(AIGradeFeedbackGenerator.name);

  public constructor(
    @Inject(AI_TEXT_GENERATOR_TOKEN)
    private readonly _aiTextGenerator: IAITextGenerator,
  ) {}

  public async generate(context: GradeFeedbackContext): Promise<GeneratedGradeFeedback> {
    if (!this._aiTextGenerator.isAvailable()) {
      return buildDeterministicGradeFeedback(context);
    }

    let result: AITextGenerationResult;

    try {
      result = await this._aiTextGenerator.generate(buildGradeFeedbackPrompt(context), {
        temperature: GRADE_FEEDBACK_TEMPERATURE,
        maxTokens: GRADE_FEEDBACK_MAX_TOKENS,
      });
    } catch (error: unknown) {
      this._logger.warn(`Grade feedback generation failed (${error instanceof Error ? error.name : "UnknownError"}); using deterministic feedback`);

      return buildDeterministicGradeFeedback(context);
    }

    const content: GradeFeedbackContent | undefined = parseGradeFeedbackResponse(result.text, context);

    if (!content) {
      this._logger.warn("Grade feedback response was not usable; using deterministic feedback");

      return buildDeterministicGradeFeedback(context);
    }

    return { ...content, source: LLM_FEEDBACK_SOURCE, provider: GRADE_FEEDBACK_AI_PROVIDER, model: result.model };
  }
}
