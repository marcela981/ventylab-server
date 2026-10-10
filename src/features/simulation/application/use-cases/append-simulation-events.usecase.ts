/*
 * Funcionalidad: Caso de uso AppendSimulationEventsUseCase
 * Descripción: Registra un lote de eventos del cliente en una sesión activa del actor bajo bloqueo de fila de la sesión: aplica antes las transiciones diferidas (examen vencido, abandono), descarta los ids ya registrados en la sesión (idempotencia) y rechaza los de otra sesión, exige tiempo simulado no decreciente y no adelantado al tiempo real por el multiplicador más la tolerancia, valida los ajustes contra los límites del motor, guarda solo los campos conocidos y actualiza el último tiempo simulado y la última actividad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type AppendSimulationEventsCommand } from "@/features/simulation/application/commands/append-simulation-events.command";
import { type AppendSimulationEventsResult } from "@/features/simulation/application/results/simulation-session.results";
import { type SimulationCaseDefinition } from "@/features/simulation/application/services/simulation-case.mapper";
import { SimulationSessionRuntime } from "@/features/simulation/application/services/simulation-session-runtime.service";
import {
  SIMULATION_SESSION_SETTINGS_TOKEN,
  type SimulationSessionSettings,
} from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { type VentilatorSettings } from "@/features/simulation/domain/engine";
import { type SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { type SimulationEventRecord } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  type ISimulationSessionsRepository,
  SIMULATION_SESSIONS_REPOSITORY_TOKEN,
} from "@/features/simulation/domain/repositories/simulation-sessions.repository";
import {
  assertSimTimes,
  type ClientSimulationEvent,
  maxAllowedSimTimeMs,
  type SanitizedSimulationEvent,
  sanitizeClientEvents,
  settingsAfterEvents,
} from "@/features/simulation/domain/sessions/simulation-session-events";
import {
  SimulationEventBatchTooLargeError,
  SimulationEventIdConflictError,
  SimulationSessionAccessDeniedError,
  SimulationSessionNotActiveError,
} from "@/features/simulation/domain/simulation.errors";

type AppendOutcome = { readonly active: true; readonly result: AppendSimulationEventsResult } | { readonly active: false };

/**
 * @throws {SimulationEventBatchTooLargeError} If the batch exceeds the configured maximum size
 * @throws {SimulationSessionNotFoundError} If the session does not exist
 * @throws {SimulationSessionAccessDeniedError} If the caller does not own the session
 * @throws {SimulationSessionNotActiveError} If the session is ended, abandoned or past its exam deadline
 * @throws {SimulationEventIdConflictError} If an event id is already stored for another session
 * @throws {SimulationEventTimeNotMonotonicError} If simulated times decrease within the batch or against the session
 * @throws {SimulationEventTimeAheadError} If a simulated time is ahead of the elapsed real time times the multiplier plus the tolerance
 * @throws {InvalidSimulationEventPayloadError} If an event payload is malformed
 * @throws {SimulationParameterOutOfRangeError} If a PARAM_CHANGE leaves the ventilator settings out of the engine limits
 * @throws {SimulationCaseNotFoundError} If the session case no longer exists
 * @throws {SimulationCaseNotReadyError} If the session case can no longer be simulated
 */
@Injectable()
export class AppendSimulationEventsUseCase {
  public constructor(
    @Inject(SIMULATION_SESSIONS_REPOSITORY_TOKEN)
    private readonly _sessionsRepository: ISimulationSessionsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(SIMULATION_SESSION_SETTINGS_TOKEN)
    private readonly _settings: SimulationSessionSettings,
    private readonly _runtime: SimulationSessionRuntime,
  ) {}

  public async execute(command: AppendSimulationEventsCommand): Promise<AppendSimulationEventsResult> {
    if (command.events.length > this._settings.maxEventBatchSize) {
      throw new SimulationEventBatchTooLargeError(this._settings.maxEventBatchSize);
    }

    const now: Date = new Date();

    const outcome: AppendOutcome = await this._transactionManager.run(async (transaction: unknown): Promise<AppendOutcome> => {
      const session: SimulationSession = await this._runtime.lockSession(command.sessionId, transaction);

      if (!session.isOwnedBy(command.userId)) {
        throw new SimulationSessionAccessDeniedError();
      }

      await this._runtime.settle(session, now, transaction);

      if (!session.isActive) {
        return { active: false };
      }

      return { active: true, result: await this._append(session, command.events, now, transaction) };
    });

    if (!outcome.active) {
      throw new SimulationSessionNotActiveError();
    }

    return outcome.result;
  }

  private async _append(
    session: SimulationSession,
    events: readonly ClientSimulationEvent[],
    now: Date,
    transaction: unknown,
  ): Promise<AppendSimulationEventsResult> {
    const owners: Map<string, string> = await this._sessionsRepository.getEventSessionIds(
      events.map((event: ClientSimulationEvent): string => event.id),
      transaction,
    );
    const seen: Set<string> = new Set<string>();
    const fresh: ClientSimulationEvent[] = [];
    let duplicates: number = 0;

    for (const event of events) {
      const owner: string | undefined = owners.get(event.id);

      if (owner !== undefined && owner !== session.id) {
        throw new SimulationEventIdConflictError();
      }

      if (owner !== undefined || seen.has(event.id)) {
        duplicates += 1;
        continue;
      }

      seen.add(event.id);
      fresh.push(event);
    }

    if (fresh.length === 0) {
      return { accepted: 0, duplicates, lastSimTimeMs: session.lastSimTimeMs };
    }

    assertSimTimes(
      fresh.map((event: ClientSimulationEvent): number => event.simTimeMs),
      session.lastSimTimeMs,
      maxAllowedSimTimeMs(session.startedAt, now, session.timeMultiplier, this._settings.eventTimeToleranceMs),
    );

    const caseDefinition: SimulationCaseDefinition = await this._runtime.loadCase(session.caseId);
    const storedEvents: SimulationEventRecord[] = await this._sessionsRepository.getEvents(session.id, transaction);
    const currentSettings: VentilatorSettings = settingsAfterEvents(caseDefinition.engineCase.initialSettings, storedEvents);
    const sanitized: SanitizedSimulationEvent[] = sanitizeClientEvents(fresh, currentSettings);

    // Events of one batch share the transaction timestamp; a 1 ms offset per position keeps their client order on replay ties
    const records: SimulationEventRecord[] = sanitized.map(
      (event: SanitizedSimulationEvent, index: number): SimulationEventRecord => ({
        ...event,
        sessionId: session.id,
        receivedAt: new Date(now.getTime() + index),
      }),
    );
    const lastSimTimeMs: number = records[records.length - 1].simTimeMs;

    await this._sessionsRepository.insertEvents(records, transaction);

    session.recordActivity(lastSimTimeMs, now);

    await this._sessionsRepository.save(session, transaction);

    return { accepted: records.length, duplicates, lastSimTimeMs: session.lastSimTimeMs };
  }
}
