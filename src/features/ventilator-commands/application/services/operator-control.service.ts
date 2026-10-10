/*
 * Funcionalidad: Control exclusivo del operador del ventilador
 * Descripción: Estado en memoria (una sola instancia) del operador que controla el ventilador físico {reservationId, operatorUserId, since, lastSeenAt}: asignación, arrebato, liberación, presencia con gracia VENTILATOR_OPERATOR_GRACE_SECONDS cuando el operador cierra su último socket, revocación inmediata al terminar o desplazarse la reserva y refresco periódico de la reserva activa cada VENTILATOR_CONTROL_REFRESH_MS; emite ventilator:control-changed a la sala ventilator, docentes y administradores. Nunca envía comandos al dispositivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import {
  VENTILATOR_COMMANDS_AUDIENCE,
  VENTILATOR_CONTROL_CHANGED_EVENT,
  type VentilatorControlChangedPayload,
  type VentilatorControlChangeReason,
} from "@/features/ventilator-commands/application/realtime/ventilator-commands-events";
import { VENTILATOR_COMMANDS_SETTINGS_TOKEN, type VentilatorCommandsSettings } from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";

export interface OperatorControlSnapshot {
  readonly reservationId: string;
  readonly operatorUserId: string;
  readonly since: Date;
  readonly lastSeenAt: Date;
  readonly presenceExpiresAt?: Date;
}

interface ControlState {
  readonly reservationId: string;
  readonly operatorUserId: string;
  readonly since: Date;
  lastSeenAt: Date;
}

export type ControlAssignReason = Extract<VentilatorControlChangeReason, "taken" | "takeover">;

@Injectable()
export class OperatorControlService {
  private readonly _logger: Logger = new Logger(OperatorControlService.name);
  private _state: ControlState | undefined;
  private _graceTimer: ReturnType<typeof setTimeout> | undefined;
  private _presenceExpiresAt: Date | undefined;
  private _refreshTimer: ReturnType<typeof setInterval> | undefined;
  private _refreshing: Promise<void> | undefined;
  private _activeReservation: ActiveReservationSummary | undefined;

  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    @Inject(VENTILATOR_COMMANDS_SETTINGS_TOKEN)
    private readonly _settings: VentilatorCommandsSettings,
  ) {}

  public get state(): OperatorControlSnapshot | undefined {
    if (!this._state) {
      return undefined;
    }

    return { ...this._state, presenceExpiresAt: this._presenceExpiresAt };
  }

  public get activeReservation(): ActiveReservationSummary | undefined {
    return this._activeReservation;
  }

  public start(): void {
    if (this._refreshTimer !== undefined) {
      return;
    }

    void this.requestRefresh();
    this._refreshTimer = setInterval((): void => {
      void this.requestRefresh();
    }, this._settings.controlRefreshMs);
    this._refreshTimer.unref();
  }

  public stop(): void {
    if (this._refreshTimer !== undefined) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = undefined;
    }

    this._clearGraceTimer();
  }

  public isOperator(userId: string, reservationId: string): boolean {
    return this._state !== undefined && this._state.operatorUserId === userId && this._state.reservationId === reservationId;
  }

  public assign(reservationId: string, operatorUserId: string, reason: ControlAssignReason): void {
    const now: Date = new Date();

    this._clearGraceTimer();
    this._state = { reservationId, operatorUserId, since: now, lastSeenAt: now };
    this._emit({ reservationId, operatorUserId, reason });
  }

  public release(reason: VentilatorControlChangeReason): void {
    const state: ControlState | undefined = this._state;

    if (!state) {
      return;
    }

    this._clearGraceTimer();
    this._state = undefined;
    this._emit({ reservationId: state.reservationId, operatorUserId: null, reason });
  }

  public revokeForReservation(reservationId: string, reason: VentilatorControlChangeReason): void {
    if (this._state?.reservationId === reservationId) {
      this.release(reason);
    }
  }

  public syncActiveReservation(active: ActiveReservationSummary | undefined, readStartedAt: Date): void {
    this._activeReservation = active;

    // A read that started before the current operator took control may predate the reservation it belongs to
    if (this._state && this._state.since.getTime() <= readStartedAt.getTime() && this._state.reservationId !== active?.id) {
      this.release("reservation_ended");
    }
  }

  public touch(userId: string): boolean {
    if (!this._state || this._state.operatorUserId !== userId) {
      return false;
    }

    this._clearGraceTimer();
    this._state.lastSeenAt = new Date();

    return true;
  }

  public handleDisconnected(userId: string, remainingSockets: number): void {
    const state: ControlState | undefined = this._state;

    if (!state || state.operatorUserId !== userId || remainingSockets > 0 || this._graceTimer !== undefined) {
      return;
    }

    const graceMs: number = this._settings.operatorGraceMs;

    this._presenceExpiresAt = new Date(Date.now() + graceMs);
    this._graceTimer = setTimeout((): void => {
      this._graceTimer = undefined;
      this._presenceExpiresAt = undefined;

      if (this._state === state) {
        this.release("presence_timeout");
      }
    }, graceMs);
    this._graceTimer.unref();
  }

  public requestRefresh(): Promise<void> {
    if (this._refreshing !== undefined) {
      return this._refreshing;
    }

    this._refreshing = this.refresh()
      .catch((error: unknown): void => {
        this._logger.warn(`Ventilator control refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally((): void => {
        this._refreshing = undefined;
      });

    return this._refreshing;
  }

  public async refresh(): Promise<void> {
    const readStartedAt: Date = new Date();

    this.syncActiveReservation(await this._reservationsFacade.getActiveReservation(readStartedAt), readStartedAt);
  }

  private _clearGraceTimer(): void {
    if (this._graceTimer !== undefined) {
      clearTimeout(this._graceTimer);
      this._graceTimer = undefined;
    }

    this._presenceExpiresAt = undefined;
  }

  private _emit(payload: VentilatorControlChangedPayload): void {
    for (const room of VENTILATOR_COMMANDS_AUDIENCE) {
      this._realtimePublisher.emitToRoom(room, VENTILATOR_CONTROL_CHANGED_EVENT, payload);
    }
  }
}
