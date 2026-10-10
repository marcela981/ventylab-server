/*
 * Funcionalidad: Casos de uso de métricas de telemetría
 * Descripción: Consulta de la instantánea de métricas (tasas, contadores y percentiles de latencia), exportación de cada muestra de latencia retenida y reinicio de las métricas en memoria
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITelemetryClock, TELEMETRY_CLOCK_TOKEN } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";
import {
  type TelemetryMetricSample,
  TelemetryMetricsService,
  type TelemetryMetricsSnapshot,
} from "@/features/ventilator-telemetry/application/services/telemetry-metrics.service";

@Injectable()
export class GetTelemetryMetricsUseCase {
  public constructor(
    private readonly _metrics: TelemetryMetricsService,
    @Inject(TELEMETRY_CLOCK_TOKEN)
    private readonly _clock: ITelemetryClock,
  ) {}

  public execute(): TelemetryMetricsSnapshot {
    return this._metrics.snapshot(this._clock.now());
  }
}

@Injectable()
export class GetTelemetryMetricSamplesUseCase {
  public constructor(private readonly _metrics: TelemetryMetricsService) {}

  public execute(): TelemetryMetricSample[] {
    return this._metrics.samples();
  }
}

@Injectable()
export class ResetTelemetryMetricsUseCase {
  public constructor(private readonly _metrics: TelemetryMetricsService) {}

  public execute(): void {
    this._metrics.reset();
  }
}
