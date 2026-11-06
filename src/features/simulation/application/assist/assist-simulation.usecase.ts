/*
 * Funcionalidad: Caso de uso de asistencia de IA en simulación
 * Descripción: Lee el contexto de una sesión activa del actor al tiempo simulado actual de la consola (repetición del servidor validada), aplica la política de asistencia (en examen solo con ALLOWED_WITH_PENALTY), redacta el nombre del estudiante y los correos del resumen del caso y de la pregunta, pide la respuesta de SIM_ASSIST por AiGateway (cuota por usuario, enlace a la sesión, hash y tiempo simulado del estado en la telemetría y respaldo con el asesor determinista sobre ese mismo estado), la valida contra el estado actual antes de entregarla (una regeneración y luego la sugerencia determinista con aviso) y al terminar registra el evento AI_HELP con el aiCallId, el origen y el tiempo analizado; el evento final informa el estado analizado
 * Versión: 1.1 (estado actual, validador de coherencia y estado analizado en la respuesta)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type AiCallOptions, AiGateway } from "@/features/ai/application/services/ai-gateway";
import { redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { type AssistSimulationCommand } from "@/features/simulation/application/assist/assist-simulation.command";
import {
  assistCoherenceValidator,
  type CoherentAssistAnswer,
  coherentAssistAnswer,
  contextHashOf,
} from "@/features/simulation/application/assist/coherent-assist-answer";
import {
  type SimulationAssistEvent,
  SimulationAssistStreamResult,
  type SimulationHelpAnalysis,
} from "@/features/simulation/application/assist/simulation-assist-stream.result";
import { type SimulationAssistContext, SimulationAssistContextService } from "@/features/simulation/application/services/simulation-assist-context.service";
import { type AssistCoherenceState } from "@/features/simulation/domain/assist/assist-coherence";
import { type AssistStateInput, buildAssistState } from "@/features/simulation/domain/assist/assist-state-snapshot";
import { adviseDeterministically } from "@/features/simulation/domain/assist/deterministic-assist-advisor";
import { SimulationAssistanceDisabledError } from "@/features/simulation/domain/simulation.errors";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

export const SIMULATION_ASSIST_REF_TYPE: string = "simulation_session";

const MIN_NAME_TOKEN_LENGTH: number = 3;

export function isAssistanceAllowed(context: SimulationAssistContext): boolean {
  return context.input.mode !== "EXAM" || context.assistancePolicy === "ALLOWED_WITH_PENALTY";
}

/** The analyzed state the console shows above the answer ("Analizado en t = mm:ss · gravedad X %") */
export function analysisOf(context: SimulationAssistContext): SimulationHelpAnalysis {
  const patient: AssistStateInput["metrics"]["patient"] = context.input.metrics.patient;

  return { simTimeMs: context.simTimeMs, severity: patient?.severity ?? null, patientStatus: patient?.status ?? null };
}

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the session belongs to another user
 * @throws {SimulationSessionNotActiveError} If the session is not active
 * @throws {SimulationAssistanceDisabledError} If the session is an exam whose rubric disables assistance
 * @throws {SimulationEventTimeNotMonotonicError} If the simulated time of the request is behind the last stored event
 * @throws {SimulationEventTimeAheadError} If the simulated time of the request is ahead of the wall-clock bound
 * @throws {AiQuotaExceededError} If the user reached the daily SIM_ASSIST quota
 */
@Injectable()
export class AssistSimulationUseCase {
  public constructor(
    private readonly _assistContext: SimulationAssistContextService,
    private readonly _aiGateway: AiGateway,
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async execute(command: AssistSimulationCommand): Promise<SimulationAssistStreamResult> {
    const context: SimulationAssistContext = await this._assistContext.getAssistContext(command.sessionId, command.userId, {
      simTimeMs: command.simTimeMs,
      clientSnapshot: command.clientSnapshot,
      unsentChanges: command.unsentChanges,
    });

    if (!isAssistanceAllowed(context)) {
      throw new SimulationAssistanceDisabledError();
    }

    const names: string[] = await this._redactableNames(command.userId);
    const input: AssistStateInput = { ...this._redactCase(context.input, names), language: command.language };
    const simulationState: string = buildAssistState(input);
    const question: string = redactPersonalData(command.question?.trim() ?? "", names);
    const state: AssistCoherenceState = { metrics: input.metrics, trends: input.trends, targets: input.targets };
    const options: AiCallOptions = {
      userId: command.userId,
      userRole: command.userRole,
      refType: SIMULATION_ASSIST_REF_TYPE,
      refId: context.sessionId,
      fallback: (): string => adviseDeterministically(input, command.language),
      signal: command.signal,
      trace: { contextHash: contextHashOf(simulationState), simTimeMs: context.simTimeMs, contextCheck: context.comparison.check },
      validate: assistCoherenceValidator(state),
    };
    // Requested here so the quota check runs before the stream opens (regular JSON error envelope); the answer is pulled by the relay.
    const first: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream("SIM_ASSIST", { simulationState, question, language: command.language }, options);
    const answer = (): Promise<CoherentAssistAnswer | null> =>
      coherentAssistAnswer({
        first,
        regenerate: (correction: string | undefined): Promise<AsyncIterable<AiStreamChunk>> =>
          this._aiGateway.stream("SIM_ASSIST", { simulationState, question, language: command.language, correction }, options),
        state,
        deterministic: (): string => adviseDeterministically(input, command.language),
        language: command.language,
        signal: command.signal,
      });

    return new SimulationAssistStreamResult({ sessionId: context.sessionId, events: this._relay(answer, context, command.userId) });
  }

  // The answer is held until it is complete and checked; the AI_HELP event is written only then, so an aborted or interrupted answer is neither counted nor penalized.
  private async *_relay(answer: () => Promise<CoherentAssistAnswer | null>, context: SimulationAssistContext, userId: string): AsyncGenerator<SimulationAssistEvent> {
    const answered: CoherentAssistAnswer | null = await answer();

    if (answered === null) {
      return;
    }

    const { text, source, aiCallId, notice } = answered;

    yield { type: "delta", text };

    const aiHelpEventId: string = await this._assistContext.recordAiHelp(context.sessionId, userId, {
      aiCallId: aiCallId.length > 0 ? aiCallId : undefined,
      source,
      simTimeMs: context.simTimeMs,
    });

    yield { type: "done", aiHelpEventId, aiCallId, source, analysis: analysisOf(context), ...(notice === undefined ? {} : { notice }) };
  }

  private _redactCase(input: AssistStateInput, names: readonly string[]): AssistStateInput {
    const { caseSummary } = input;

    return {
      ...input,
      caseSummary: {
        ...caseSummary,
        title: redactPersonalData(caseSummary.title, names),
        summary: caseSummary.summary === undefined ? undefined : redactPersonalData(caseSummary.summary, names),
      },
    };
  }

  // Whole-word matching in the guard lets given names and surnames be redacted individually; tokens under three characters ("de", "la") are skipped.
  private async _redactableNames(userId: string): Promise<string[]> {
    const user: UserAccount | undefined = await this._usersFacade.getUserById(userId);
    const fullName: string = (user?.name ?? "").trim().split(/\s+/u).filter((token: string) => token.length > 0).join(" ");

    if (fullName.length === 0) {
      return [];
    }

    const tokens: string[] = fullName.split(" ").filter((token: string) => token.length >= MIN_NAME_TOKEN_LENGTH && token !== fullName);

    return [...new Set([fullName, ...tokens])];
  }
}
