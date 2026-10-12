/*
 * Funcionalidad: Monitor del estado del sistema
 * Descripción: Reevalúa el estado del sistema sin sondeo desde el cliente: al cambiar la conexión con el broker MQTT, al recibir los eventos del bus de dispositivo en línea o fuera de línea, tras una sonda manual de IA y con un temporizador del servidor (cada SYSTEM_STATUS_REEVALUATE_INTERVAL_MS) que solo corre mientras haya al menos un socket de un ADMIN o TEACHER conectado, para detectar caídas de la base de datos o del broker que no generan eventos; cada reevaluación puede emitir system:status-changed
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";

import { SYSTEM_STATUS_AUDIENCE_ROLES, SystemStatusService } from "@/features/system-status/application/services/system-status.service";
import { SYSTEM_STATUS_SETTINGS_TOKEN, type SystemStatusSettings } from "@/features/system-status/application/tokens/system-status-settings.token";
import { VentilatorTelemetryFacade } from "@/features/ventilator-telemetry/application/services/ventilator-telemetry.facade";

@Injectable()
export class SystemStatusMonitor implements OnModuleInit, OnModuleDestroy {
  private readonly _logger: Logger = new Logger(SystemStatusMonitor.name);
  private readonly _watchers: Set<string> = new Set<string>();
  private _timer: NodeJS.Timeout | undefined;
  private _unsubscribeConnection: (() => void) | undefined;

  public constructor(
    private readonly _status: SystemStatusService,
    private readonly _ventilator: VentilatorTelemetryFacade,
    @Inject(SYSTEM_STATUS_SETTINGS_TOKEN)
    private readonly _settings: SystemStatusSettings,
  ) {}

  public get watcherCount(): number {
    return this._watchers.size;
  }

  public onModuleInit(): void {
    this._unsubscribeConnection = this._ventilator.mqttConnection.onConnectionChange(() => this.reevaluate());
    this._timer = setInterval(() => this.tick(), this._settings.reevaluateIntervalMs);
    this._timer.unref();
  }

  public onModuleDestroy(): void {
    this._unsubscribeConnection?.();

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  public watch(socketId: string, role: string): void {
    if (SYSTEM_STATUS_AUDIENCE_ROLES.includes(role)) {
      this._watchers.add(socketId);
    }
  }

  public unwatch(socketId: string): void {
    this._watchers.delete(socketId);
  }

  public tick(): void {
    if (this._watchers.size > 0) {
      this.reevaluate();
    }
  }

  public reevaluate(): void {
    this._status.refresh().catch((error: unknown) => {
      this._logger.error(`System status re-evaluation failed: ${error instanceof Error ? error.name : "UnknownError"}`);
    });
  }
}
