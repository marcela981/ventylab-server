/*
 * Funcionalidad: Servicio EvaluationFeedbackGenerator
 * Descripción: Genera la retroalimentación de una evaluación de caso clínico con el gateway de IA (AiGateway, caso de uso GRADE_FEEDBACK en español, referencia clinical_case_attempt, usuario y rol para cuota y telemetría) a partir del prompt pedagógico; si el gateway responde con el respaldo determinista o falla usa la retroalimentación determinística de respaldo
 * Versión: 2.0
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
import { type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ConfigurationComparison,
  type EvaluationFeedback,
  type ExpertConfigurationData,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import { buildFeedbackPrompt, generateFallbackFeedback, parseFeedbackResponse } from "@/features/clinical-cases/domain/services/evaluation-feedback";

export const CLINICAL_CASE_ATTEMPT_REF_TYPE: string = "clinical_case_attempt";

export interface FeedbackRequester {
  readonly userId: string;
  readonly userRole?: string;
}

@Injectable()
export class EvaluationFeedbackGenerator {
  private readonly _logger: Logger = new Logger(EvaluationFeedbackGenerator.name);

  public constructor(private readonly _aiGateway: AiGateway) {}

  public async generateFeedback(
    clinicalCase: ClinicalCaseDetail,
    userConfig: VentilatorConfiguration,
    expertConfig: ExpertConfigurationData,
    differences: ConfigurationComparison,
    requester?: FeedbackRequester,
  ): Promise<EvaluationFeedback> {
    const deterministic: EvaluationFeedback = generateFallbackFeedback(differences);
    let result: AiResult;

    try {
      result = await this._aiGateway.complete(
        "GRADE_FEEDBACK",
        { userPrompt: buildFeedbackPrompt(clinicalCase, userConfig, expertConfig, differences), language: ES_LANGUAGE_VALUE },
        {
          fallback: () => JSON.stringify(deterministic),
          refType: CLINICAL_CASE_ATTEMPT_REF_TYPE,
          userId: requester?.userId,
          userRole: requester?.userRole,
        },
      );
    } catch (error: unknown) {
      this._logger.warn(`AI feedback generation failed (${error instanceof Error ? error.name : "UnknownError"}); using fallback feedback`);

      return deterministic;
    }

    if (result.source !== "LLM" || !result.content.trim()) {
      return deterministic;
    }

    return parseFeedbackResponse(result.content, differences);
  }
}
