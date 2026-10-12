/*
 * Funcionalidad: Métricas del proceso Node
 * Descripción: Implementa IProcessMetrics con process.uptime, process.memoryUsage y un histograma de perf_hooks.monitorEventLoopDelay; el retardo del bucle de eventos es la media desde la lectura anterior, en milisegundos
 * Versión: 1.0
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
      eventLoopLagMs: Number.isFinite(meanNs) ? Math.round((meanNs / NANOSECONDS_PER_MS) * 100) / 100 : 0,
    };
  }
}
