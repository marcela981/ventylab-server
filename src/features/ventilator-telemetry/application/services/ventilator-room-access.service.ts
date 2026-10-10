/*
 * Funcionalidad: Acceso a la sala de telemetría del ventilador
 * Descripción: Fuera del camino caliente, cada VENTILATOR_ROOM_REFRESH_MS (y de inmediato ante eventos de reserva) consulta la reserva activa; cuando cambia vacía la sala ventilator, une a los titulares y difunde ventilator:availability sin datos personales; une al titular que se autentica y responde a ventilator:join (titular unido, docente o administrador por su sala de rol, el resto recibe ventilator:join-rejected)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN, VENTILATOR_ROOM } from "@/common/application/ports/realtime-publisher.interface";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import {
  isPrivilegedTelemetryRole,
  VENTILATOR_AVAILABILITY_EVENT,
  VENTILATOR_JOIN_REJECTED_EVENT,
  type VentilatorAvailabilityPayload,
  type VentilatorJoinRejectedPayload,
} from "@/features/ventilator-telemetry/application/realtime/ventilator-telemetry-events";
import { VENTILATOR_TELEMETRY_SETTINGS_TOKEN, type VentilatorTelemetrySettings } from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";

export type VentilatorJoinOutcome = "joined" | "privileged" | "rejected";

export interface VentilatorClientIdentity {
  readonly userId: string;
  readonly role: string;
}

export type ActiveReservationChangeListener = (activeReservationId: string | undefined) => void;

@Injectable()
export class VentilatorRoomAccessService {
  private readonly _logger: Logger = new Logger(VentilatorRoomAccessService.name);
  private readonly _listeners: Set<ActiveReservationChangeListener> = new Set<ActiveReservationChangeListener>();
  private _initialized: boolean = false;
  private _activeReservationId: string | undefined;
  private _holders: ReadonlySet<string> = new Set<string>();
  private _availability: VentilatorAvailabilityPayload = { occupied: false };
  private _refreshing: Promise<void> | undefined;
  private _refreshQueued: boolean = false;
  private _timer: ReturnType<typeof setInterval> | undefined;

  public constructor(
    private readonly _reservationsFacade: ReservationsFacade,
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
    @Inject(VENTILATOR_TELEMETRY_SETTINGS_TOKEN)
    private readonly _settings: VentilatorTelemetrySettings,
  ) {}

  public get activeReservationId(): string | undefined {
    return this._activeReservationId;
  }

  public get availability(): VentilatorAvailabilityPayload {
    return this._availability;
  }

  public start(): void {
    if (this._timer !== undefined) {
      return;
    }

    void this.requestRefresh();
    this._timer = setInterval((): void => {
      void this.requestRefresh();
    }, this._settings.roomRefreshMs);
    this._timer.unref();
  }

  public stop(): void {
    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  public onActiveReservationChange(listener: ActiveReservationChangeListener): () => void {
    this._listeners.add(listener);

    return (): void => {
      this._listeners.delete(listener);
    };
  }

  public isHolder(userId: string): boolean {
    return this._holders.has(userId);
  }

  public requestRefresh(): Promise<void> {
    if (this._refreshing !== undefined) {
      this._refreshQueued = true;

      return this._refreshing;
    }

    this._refreshing = this.refresh()
      .catch((error: unknown): void => {
        this._logger.warn(`Ventilator room refresh failed: ${error instanceof Error ? error.message : String(error)}`);
      })
      .finally((): void => {
        this._refreshing = undefined;

        if (this._refreshQueued) {
          this._refreshQueued = false;
          void this.requestRefresh();
        }
      });

    return this._refreshing;
  }

  public async refresh(): Promise<void> {
    const active: ActiveReservationSummary | undefined = await this._reservationsFacade.getActiveReservation(new Date());
    const activeId: string | undefined = active?.id;

    if (this._initialized && activeId === this._activeReservationId) {
      return;
    }

    const holders: string[] = active ? await this._reservationsFacade.listHolderUserIds(active) : [];

    this._realtimePublisher.clearRoom(VENTILATOR_ROOM);

    for (const userId of holders) {
      this._realtimePublisher.joinRoom(userId, VENTILATOR_ROOM);
    }

    this._initialized = true;
    this._activeReservationId = activeId;
    this._holders = new Set<string>(holders);
    this._availability = active
      ? { occupied: true, startsAt: active.startsAt.toISOString(), endsAt: active.endsAt.toISOString() }
      : { occupied: false };

    this._realtimePublisher.broadcast(VENTILATOR_AVAILABILITY_EVENT, this._availability);

    for (const listener of this._listeners) {
      try {
        listener(activeId);
      } catch (error: unknown) {
        this._logger.error(`Active reservation listener failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  public handleClientAuthenticated(identity: VentilatorClientIdentity): void {
    if (this._holders.has(identity.userId)) {
      this._realtimePublisher.joinRoom(identity.userId, VENTILATOR_ROOM);
    }

    this._realtimePublisher.emitToUser(identity.userId, VENTILATOR_AVAILABILITY_EVENT, this._availability);
  }

  public handleJoinRequest(identity: VentilatorClientIdentity): VentilatorJoinOutcome {
    if (this._holders.has(identity.userId)) {
      this._realtimePublisher.joinRoom(identity.userId, VENTILATOR_ROOM);
      this._realtimePublisher.emitToUser(identity.userId, VENTILATOR_AVAILABILITY_EVENT, this._availability);

      return "joined";
    }

    if (isPrivilegedTelemetryRole(identity.role)) {
      this._realtimePublisher.emitToUser(identity.userId, VENTILATOR_AVAILABILITY_EVENT, this._availability);

      return "privileged";
    }

    const rejection: VentilatorJoinRejectedPayload = {
      reason: this._activeReservationId === undefined ? "no_active_reservation" : "not_reservation_holder",
    };

    this._realtimePublisher.emitToUser(identity.userId, VENTILATOR_JOIN_REJECTED_EVENT, rejection);
    this._realtimePublisher.emitToUser(identity.userId, VENTILATOR_AVAILABILITY_EVENT, this._availability);

    return "rejected";
  }
}
