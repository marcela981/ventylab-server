/*
 * Funcionalidad: Servicio EvaluationFeedbackGenerator
 * Descripción: Genera la retroalimentación de una evaluación con IAITextGenerator (temperatura 0.7, 1500 tokens) a partir del prompt pedagógico; si la IA no está disponible, falla o responde vacío usa la retroalimentación determinística de respaldo
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
import { AIGenerationFailedError } from "@/common/domain/errors/ai-generation-failed.error";
import { AIUnavailableError } from "@/common/domain/errors/ai-unavailable.error";
import { type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ConfigurationComparison,
  type EvaluationFeedback,
  type ExpertConfigurationData,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import {
  buildFeedbackPrompt,
  FEEDBACK_AI_MAX_TOKENS,
  FEEDBACK_AI_TEMPERATURE,
  generateFallbackFeedback,
  parseFeedbackResponse,
} from "@/features/clinical-cases/domain/services/evaluation-feedback";

@Injectable()
export class EvaluationFeedbackGenerator {
  private readonly _logger: Logger = new Logger(EvaluationFeedbackGenerator.name);

  public constructor(
    @Inject(AI_TEXT_GENERATOR_TOKEN)
    private readonly _aiTextGenerator: IAITextGenerator,
  ) {}

  public async generateFeedback(
    clinicalCase: ClinicalCaseDetail,
    userConfig: VentilatorConfiguration,
    expertConfig: ExpertConfigurationData,
    differences: ConfigurationComparison,
  ): Promise<EvaluationFeedback> {
    const prompt: string = buildFeedbackPrompt(clinicalCase, userConfig, expertConfig, differences);

    try {
      const result: AITextGenerationResult = await this._aiTextGenerator.generate(prompt, {
        temperature: FEEDBACK_AI_TEMPERATURE,
        maxTokens: FEEDBACK_AI_MAX_TOKENS,
      });

      if (!result.text) {
        this._logger.warn("AI feedback response was empty; using fallback feedback");

        return generateFallbackFeedback(differences);
      }

      return parseFeedbackResponse(result.text, differences);
    } catch (error) {
      if (error instanceof AIUnavailableError || error instanceof AIGenerationFailedError) {
        this._logger.warn(`AI feedback generation failed (${error.code}); using fallback feedback`);

        return generateFallbackFeedback(differences);
      }

      throw error;
    }
  }
}
