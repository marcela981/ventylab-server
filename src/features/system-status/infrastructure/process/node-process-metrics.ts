/*
 * Funcionalidad: Métricas del proceso Node
 * Descripción: Implementa IProcessMetrics con process.uptime, process.memoryUsage y un histograma de perf_hooks.monitorEventLoopDelay; el retardo del bucle de eventos es la media desde la lectura anterior menos la resolución del histograma, en milisegundos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { monitorEventLoopDelay, type IntervalHistogram } from "perf_hooks";

import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";

import { type IProcessMetrics, type ProcessMetricsSnapshot } from "@/features/system-status/application/ports/process-metrics.interface";

const HISTOGRAM_RESOLUTION_MS: number = 20;

const NANOSECONDS_PER_MS: number = 1_000_000;

// The histogram samples with a timer of HISTOGRAM_RESOLUTION_MS, so every sample already includes that interval; only the excess is lag.
export function toEventLoopLagMs(meanNs: number, resolutionMs: number = HISTOGRAM_RESOLUTION_MS): number {
  if (!Number.isFinite(meanNs)) {
    return 0;
  }

  return Math.round(Math.max(0, meanNs / NANOSECONDS_PER_MS - resolutionMs) * 100) / 100;
}

@Injectable()
export class NodeProcessMetrics implements IProcessMetrics, OnModuleInit, OnModuleDestroy {
  private readonly _eventLoopDelay: IntervalHistogram = monitorEventLoopDelay({ resolution: HISTOGRAM_RESOLUTION_MS });

  public onModuleInit(): void {
    this._eventLoopDelay.enable();
  }

  public onModuleDestroy(): void {
    this._eventLoopDelay.disable();
  }

  public snapshot(): ProcessMetricsSnapshot {
    const memory: NodeJS.MemoryUsage = process.memoryUsage();
    const meanNs: number = this._eventLoopDelay.mean;

    this._eventLoopDelay.reset();

    return {
      uptimeSeconds: Math.round(process.uptime()),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      eventLoopLagMs: toEventLoopLagMs(meanNs),
    };
  }
}
