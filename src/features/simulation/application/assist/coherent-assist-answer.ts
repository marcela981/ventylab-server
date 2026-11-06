/*
 * Funcionalidad: Respuesta coherente de la asistencia de IA del simulador
 * Descripción: Pide la respuesta de SIM_ASSIST o SIM_ALARM_HELP por AiGateway con el validador de coherencia como opción de la llamada (la telemetría registra rejectionReason inconsistency y el hash y el tiempo simulado del estado enviado), la retiene completa antes de entregarla y, si contradice el estado actual (afirma estabilidad con el paciente crítico o cita signos que no son los actuales), la pide una vez más con una nota correctiva; si vuelve a fallar (o la regeneración ya no se puede pedir) entrega la sugerencia determinista con el aviso INCONSISTENT_STATE
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { type LanguageValue } from "@/common/domain/value-objects/language";
import { DETERMINISTIC_RESULT_SOURCE, type AiResultSource, type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { type AssistCoherenceIssue, type AssistCoherenceState, checkAssistCoherence, INCONSISTENCY_REJECTION_REASON } from "@/features/simulation/domain/assist/assist-coherence";

/** Notice of an answer replaced by the deterministic suggestion because the AI kept contradicting the current state */
export const INCONSISTENT_STATE_NOTICE: string = "INCONSISTENT_STATE";

export type AssistAnswerNotice = typeof INCONSISTENT_STATE_NOTICE;

export interface CoherentAssistAnswer {
  readonly text: string;
  readonly source: AiResultSource;
  readonly aiCallId: string;
  readonly notice?: AssistAnswerNotice;
}

export interface CoherentAssistRequest {
  /** The first answer, already requested (with assistCoherenceValidator in its options) so its quota check came first */
  readonly first: AsyncIterable<AiStreamChunk>;
  /** The regeneration with its corrective note */
  readonly regenerate: (correction: string | undefined) => Promise<AsyncIterable<AiStreamChunk>>;
  readonly state: AssistCoherenceState;
  readonly deterministic: () => string;
  readonly language: LanguageValue;
  readonly signal?: AbortSignal;
}

/** Validator option of the simulator help calls: the telemetry records an incoherent answer with reason inconsistency */
export function assistCoherenceValidator(state: AssistCoherenceState): (content: string) => string | undefined {
  return (content: string): string | undefined => (checkAssistCoherence(content, state) === undefined ? undefined : INCONSISTENCY_REJECTION_REASON);
}

const MAX_ATTEMPTS: number = 2;

/** sha256 hex of the state text actually sent to the provider (the state carries no personal data) */
export function contextHashOf(stateText: string): string {
  return createHash("sha256").update(stateText, "utf8").digest("hex");
}

function correctionFor(issue: AssistCoherenceIssue, language: LanguageValue): string {
  if (issue.kind === "CLAIMS_STABLE") {
    return language === "en"
      ? `You said the patient is stable ("${issue.detail}") but the current state is critical or has high-priority alarms: start with the stabilization actions.`
      : `Dijiste que el paciente está estable («${issue.detail}») pero el estado actual es crítico o tiene alarmas de prioridad alta: empieza por las acciones de estabilización.`;
  }

  return language === "en"
    ? `You cited ${issue.detail}: use only the values of the current state.`
    : `Citaste ${issue.detail}: usa solo los valores del estado actual.`;
}

interface AttemptOutcome {
  readonly text: string;
  readonly source: AiResultSource;
  readonly aiCallId: string;
  readonly rejected: boolean;
}

/** null when the stream ended without a result (the caller aborted): nothing is answered nor recorded */
async function attempt(chunks: AsyncIterable<AiStreamChunk>): Promise<AttemptOutcome | null> {
  let text: string = "";

  for await (const chunk of chunks) {
    if (chunk.type === "delta") {
      text += chunk.text;

      continue;
    }

    return { text: chunk.result.content.length > 0 ? chunk.result.content : text, source: chunk.result.source, aiCallId: chunk.result.aiCallId, rejected: chunk.result.rejectionReason !== undefined };
  }

  return null;
}

/**
 * The answer is held until it is complete and checked, so a contradiction never reaches the student.
 * @returns null when the caller aborted before an answer was complete
 * @throws Whatever the first provider call throws (quota, providers unavailable, abort); a failed regeneration falls back instead
 */
export async function coherentAssistAnswer(request: CoherentAssistRequest): Promise<CoherentAssistAnswer | null> {
  let correction: string | undefined;
  let lastCallId: string = "";

  for (let index: number = 0; index < MAX_ATTEMPTS; index++) {
    let outcome: AttemptOutcome | null;

    try {
      outcome = await attempt(index === 0 ? request.first : await request.regenerate(correction));
    } catch (error: unknown) {
      if (index === 0 || request.signal?.aborted === true) {
        throw error;
      }

      break;
    }

    if (outcome === null) {
      return null;
    }

    lastCallId = outcome.aiCallId;

    if (outcome.source === DETERMINISTIC_RESULT_SOURCE || !outcome.rejected) {
      return { text: outcome.text, source: outcome.source, aiCallId: outcome.aiCallId };
    }

    const issue: AssistCoherenceIssue | undefined = checkAssistCoherence(outcome.text, request.state);

    correction = issue === undefined ? undefined : correctionFor(issue, request.language);
  }

  return { text: request.deterministic(), source: DETERMINISTIC_RESULT_SOURCE, aiCallId: lastCallId, notice: INCONSISTENT_STATE_NOTICE };
}
