/*
 * Funcionalidad: Generador de retroalimentación de calificación con IA
 * Descripción: Implementa IGradeFeedbackGenerator sobre el gateway de IA (caso GRADE_FEEDBACK con el prompt del consumidor y la retroalimentación determinística como respaldo, sin usuario: es una llamada de sistema sin cuota; la llamada se enlaza al intento con refType evaluation_attempt y refId, que nunca entran al prompt); toma proveedor y modelo del resultado y, si el gateway usa el respaldo, falla o responde algo no interpretable, devuelve la retroalimentación determinística. Solo registra el nombre del error, nunca el prompt ni las respuestas del estudiante
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";

import { ES_LANGUAGE_VALUE } from "@/common/domain/value-objects/language";
import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type GradeFeedbackGenerationOptions, type IGradeFeedbackGenerator } from "@/features/evaluation/application/ports/grade-feedback-generator.interface";
import { buildDeterministicGradeFeedback } from "@/features/evaluation/domain/services/deterministic-grade-feedback";
import { buildGradeFeedbackPrompt, parseGradeFeedbackResponse } from "@/features/evaluation/domain/services/grade-feedback-prompt";
import {
  type GeneratedGradeFeedback,
  type GradeFeedbackContent,
  type GradeFeedbackContext,
  LLM_FEEDBACK_SOURCE,
} from "@/features/evaluation/domain/value-objects/grade-feedback";

const GRADE_FEEDBACK_REF_TYPE: string = "evaluation_attempt";

@Injectable()
export class AIGradeFeedbackGenerator implements IGradeFeedbackGenerator {
  private readonly _logger: Logger = new Logger(AIGradeFeedbackGenerator.name);

  public constructor(private readonly _aiGateway: AiGateway) {}

  public async generate(context: GradeFeedbackContext, options: GradeFeedbackGenerationOptions): Promise<GeneratedGradeFeedback> {
    const deterministic: GeneratedGradeFeedback = buildDeterministicGradeFeedback(context);
    let result: AiResult;

    try {
      result = await this._aiGateway.complete(
        "GRADE_FEEDBACK",
        { userPrompt: buildGradeFeedbackPrompt(context), language: ES_LANGUAGE_VALUE },
        { fallback: () => JSON.stringify(deterministic), refType: GRADE_FEEDBACK_REF_TYPE, refId: options.attemptId },
      );
    } catch (error: unknown) {
      this._logger.warn(`Grade feedback generation failed (${error instanceof Error ? error.name : "UnknownError"}); using deterministic feedback`);

      return deterministic;
    }

    if (result.source !== LLM_FEEDBACK_SOURCE) {
      return deterministic;
    }

    const content: GradeFeedbackContent | undefined = parseGradeFeedbackResponse(result.content, context);

    if (!content) {
      this._logger.warn("Grade feedback response was not usable; using deterministic feedback");

      return deterministic;
    }

    return { ...content, source: LLM_FEEDBACK_SOURCE, provider: result.provider, model: result.model };
  }
}
