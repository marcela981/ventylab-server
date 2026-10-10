/*
 * Funcionalidad: Caso de uso EndSimulationSessionUseCase
 * Descripción: Termina una sesión activa del actor bajo bloqueo de fila: valida el tiempo simulado final (no decreciente y no adelantado al tiempo real por el multiplicador más la tolerancia), sin tiempo del cliente usa el tiempo real transcurrido por el multiplicador, acotado por el límite antimanipulación y la fecha límite del intento de examen y nunca menor que el último evento; repite la simulación hasta ese tiempo, calcula el resumen calificado con la rúbrica de la sesión, registra el evento END y deja la sesión en ENDED; nunca acepta una calificación del cliente
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type EndSimulationSessionCommand } from "@/features/simulation/application/commands/end-simulation-session.command";
import { type SimulationSessionSummaryResult } from "@/features/simulation/application/results/simulation-session.results";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import {
  SIMULATION_SESSION_SETTINGS_TOKEN,
  type SimulationSessionSettings,
} from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationSessionSummary } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import { assertSimTimes, maxAllowedSimTimeMs } from "@/features/simulation/domain/sessions/simulation-session-events";
import { SimulationSessionAccessDeniedError, SimulationSessionNotActiveError } from "@/features/simulation/domain/simulation.errors";

type EndOutcome = { readonly active: true; readonly result: SimulationSessionSummaryResult } | { readonly active: false };

/**
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the caller does not own the session
 * @throws {SimulationSessionNotActiveError} If the session is already ended, abandoned or past its exam deadline
 * @throws {SimulationEventTimeNotMonotonicError} If the final simulated time is before the last accepted event
 * @throws {SimulationEventTimeAheadError} If the final simulated time is ahead of the elapsed real time times the multiplier plus the tolerance
 * @throws {SimulationCaseNotFoundError} If the session case no longer exists
 * @throws {SimulationCaseNotReadyError} If the session case can no longer be simulated
 * @throws {SimulationRubricInvalidError} If the session rubric is invalid
 */
@Injectable()
export class EndSimulationSessionUseCase {
  public constructor(
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(SIMULATION_SESSION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSessionSettings,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(command: EndSimulationSessionCommand): Promise<SimulationSessionSummaryResult> {
    const now: Date = new Date();

    const outcome: EndOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<EndOutcome> => {
      const session: SimulationSession = await this._runtime.lockSession(command.sessionId, transaction);

      if (!session.isOwnedBy(command.userId)) {
        throw new SimulationSessionAccessDeniedError();
      }

      await this._runtime.settle(session, now, transaction);

      if (!session.isActive) {
        return { active: false };
      }

      const maxAllowedMs: number = maxAllowedSimTimeMs(session.startedAt, now, session.timeMultiplier, this._settings.eventTimeToleranceMs);
      const untilMs: number = command.simTimeMs ?? (await this._defaultEndSimTimeMs(session, now, maxAllowedMs));

      assertSimTimes([untilMs], session.lastSimTimeMs, maxAllowedMs);

      const summary: SimulationSessionSummary = await this._runtime.endSession(session, untilMs, now, "CLIENT", transaction);

      return { active: true, result: { session, summary } };
    });

    if (!outcome.active) {
      throw new SimulationSessionNotActiveError();
    }

    return outcome.result;
  }

  private async _defaultEndSimTimeMs(session: SimulationSession, now: Date, maxAllowedMs: number): Promise<number> {
    const expiresAt: Date | undefined = await this._runtime.getExpiresAt(session);
    const endAt: number = expiresAt === undefined ? now.getTime() : Math.min(now.getTime(), expiresAt.getTime());
    const elapsedSimMs: number = Math.max(0, endAt - session.startedAt.getTime()) * session.timeMultiplier;

    return Math.max(session.lastSimTimeMs, Math.floor(Math.min(elapsedSimMs, maxAllowedMs)));
  }
}
