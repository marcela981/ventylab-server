/*
 * Funcionalidad: Caso de uso de asistencia de IA en simulación
 * Descripción: Lee el contexto de una sesión activa del actor, aplica la política de asistencia (en examen solo con ALLOWED_WITH_PENALTY), redacta el nombre del estudiante y los correos del resumen del caso y de la pregunta, transmite la respuesta de SIM_ASSIST por AiGateway (cuota por usuario, enlace a la sesión y respaldo con el asesor determinista) y al terminar registra el evento AI_HELP con el aiCallId y el origen de la respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiStreamChunk } from "@/features/ai/domain/results/ai-result";
import { type AssistSimulationCommand } from "@/features/simulation/application/assist/assist-simulation.command";
import { type SimulationAssistEvent, SimulationAssistStreamResult } from "@/features/simulation/application/assist/simulation-assist-stream.result";
import { type SimulationAssistContext, SimulationAssistContextService } from "@/features/simulation/application/services/simulation-assist-context.service";
import { type AssistSnapshotInput, buildAssistSnapshot } from "@/features/simulation/domain/assist/assist-snapshot";
import { adviseDeterministically } from "@/features/simulation/domain/assist/deterministic-assist-advisor";
import { SimulationAssistanceDisabledError } from "@/features/simulation/domain/simulation.errors";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

export const SIMULATION_ASSIST_REF_TYPE: string = "simulation_session";

const MIN_NAME_TOKEN_LENGTH: number = 3;

export function isAssistanceAllowed(context: SimulationAssistContext): boolean {
  return context.input.mode !== "EXAM" || context.assistancePolicy === "ALLOWED_WITH_PENALTY";
}

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the session belongs to another user
 * @throws {SimulationSessionNotActiveError} If the session is not active
 * @throws {SimulationAssistanceDisabledError} If the session is an exam whose rubric disables assistance
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
    const context: SimulationAssistContext = await this._assistContext.getAssistContext(command.sessionId, command.userId);

    if (!isAssistanceAllowed(context)) {
      throw new SimulationAssistanceDisabledError();
    }

    const names: string[] = await this._redactableNames(command.userId);
    const input: AssistSnapshotInput = this._redactCase(context.input, names);
    const chunks: AsyncIterable<AiStreamChunk> = await this._aiGateway.stream(
      "SIM_ASSIST",
      { simulationState: buildAssistSnapshot(input), question: redactPersonalData(command.question?.trim() ?? "", names), language: command.language },
      {
        userId: command.userId,
        userRole: command.userRole,
        refType: SIMULATION_ASSIST_REF_TYPE,
        refId: context.sessionId,
        fallback: (): string => adviseDeterministically(input, command.language),
        signal: command.signal,
      },
    );

    return new SimulationAssistStreamResult({ sessionId: context.sessionId, events: this._relay(chunks, context.sessionId, command.userId) });
  }

  // The AI_HELP event is written only once the answer is complete, so an aborted or interrupted answer is neither counted nor penalized.
  private async *_relay(chunks: AsyncIterable<AiStreamChunk>, sessionId: string, userId: string): AsyncGenerator<SimulationAssistEvent> {
    for await (const chunk of chunks) {
      if (chunk.type === "delta") {
        yield { type: "delta", text: chunk.text };

        continue;
      }

      const { aiCallId, source } = chunk.result;
      const aiHelpEventId: string = await this._assistContext.recordAiHelp(sessionId, userId, { aiCallId, source });

      yield { type: "done", aiHelpEventId, aiCallId, source };
    }
  }

  private _redactCase(input: AssistSnapshotInput, names: readonly string[]): AssistSnapshotInput {
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
