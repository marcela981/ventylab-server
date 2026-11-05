/*
 * Funcionalidad: Servicio de interpretación del caso por IA
 * Descripción: Al iniciar una sesión libre pide a SIM_CASE_INTERPRETATION (prompt versionado, salida JSON) los parámetros del motor a partir de la historia clínica, con un tope de tiempo; valida y acota la respuesta y devuelve el registro que se guarda en el perfil del paciente de la sesión. Sin proveedor, sin cuota, con tiempo agotado o con una respuesta inválida devuelve los valores curados del caso, nunca bloquea el inicio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { SIM_CASE_INTERPRETATION_PROMPT_VERSION } from "@/features/ai/domain/prompts/simulator-prompts";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import {
  type CaseInterpretationRecord,
  clinicalHistoryText,
  curatedParametersJson,
  curatedValues,
  type InterpretationValues,
  parseInterpretation,
  type ParsedInterpretation,
} from "@/features/simulation/application/interpretation/case-interpretation";
import { type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";

export const CASE_INTERPRETATION_REF_TYPE: string = "clinical_case";

/** Overall budget at session start; the use case timeout of the provider chain is also short (8 s) */
export const CASE_INTERPRETATION_TIMEOUT_MS: number = 8000;

export interface CaseInterpretationRequest {
  readonly caseDefinition: SimulationCaseDefinition;
  readonly patient?: SimulatedPatient;
  readonly userId: string;
}

@Injectable()
export class CaseInterpretationService {
  private readonly _logger: Logger = new Logger(CaseInterpretationService.name);

  public constructor(private readonly _aiGateway: AiGateway) {}

  public async interpret(request: CaseInterpretationRequest): Promise<CaseInterpretationRecord> {
    const curated: InterpretationValues = curatedValues(request.caseDefinition.engineCase);
    const controller: AbortController = new AbortController();
    const timer: NodeJS.Timeout = setTimeout((): void => controller.abort(), CASE_INTERPRETATION_TIMEOUT_MS);

    try {
      const result: AiResult = await this._aiGateway.complete(
        "SIM_CASE_INTERPRETATION",
        {
          clinicalHistory: clinicalHistoryText(request.caseDefinition.summary, request.patient),
          curatedParameters: curatedParametersJson(curated),
        },
        { userId: request.userId, refType: CASE_INTERPRETATION_REF_TYPE, refId: request.caseDefinition.id, signal: controller.signal },
      );
      const parsed: ParsedInterpretation | undefined = parseInterpretation(result.content, curated);

      if (parsed === undefined) {
        return CaseInterpretationService.curated(curated, "INVALID_RESPONSE", result.aiCallId);
      }

      return {
        source: "LLM",
        promptVersion: SIM_CASE_INTERPRETATION_PROMPT_VERSION,
        aiCallId: result.aiCallId,
        applied: parsed.applied,
        curated,
        rejected: parsed.rejected,
        ...(parsed.trajectory === undefined ? {} : { trajectory: parsed.trajectory }),
        ...(parsed.rationale === undefined ? {} : { rationale: parsed.rationale }),
      };
    } catch (error: unknown) {
      const reason: string = controller.signal.aborted ? "TIMEOUT" : "AI_UNAVAILABLE";

      this._logger.debug(`Case interpretation fell back to the curated values (${reason}): ${(error as Error).name}`);

      return CaseInterpretationService.curated(curated, reason);
    } finally {
      clearTimeout(timer);
    }
  }

  public static curated(curated: InterpretationValues, reason: string, aiCallId?: string): CaseInterpretationRecord {
    return {
      source: "CURATED",
      ...(aiCallId === undefined ? {} : { aiCallId, promptVersion: SIM_CASE_INTERPRETATION_PROMPT_VERSION }),
      applied: curated,
      curated,
      rejected: [],
      reason,
    };
  }
}
