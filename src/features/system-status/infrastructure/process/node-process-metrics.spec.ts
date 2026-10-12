/*
 * Funcionalidad: Pruebas de las métricas del proceso Node
 * Descripción: Verifica que el retardo del bucle de eventos descuenta la resolución del histograma, nunca es negativo, se redondea a centésimas y vale 0 sin muestras, y que la lectura reinicia el histograma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ProcessMetricsSnapshot } from "@/features/system-status/application/ports/process-metrics.interface";
import { NodeProcessMetrics, toEventLoopLagMs } from "@/features/system-status/infrastructure/process/node-process-metrics";

describe("toEventLoopLagMs", () => {
  it("subtracts the histogram resolution from the mean delay", () => {
    const lag: number = toEventLoopLagMs(23_456_789, 20);

    expect(lag).toBe(3.46);
  });

  it("is zero when the mean delay is at or below the resolution", () => {
    expect(toEventLoopLagMs(20_000_000, 20)).toBe(0);
    expect(toEventLoopLagMs(19_500_000, 20)).toBe(0);
  });

  it("is zero without samples", () => {
    expect(toEventLoopLagMs(Number.NaN)).toBe(0);
  });

  it("uses the 20 ms sampling resolution by default", () => {
    expect(toEventLoopLagMs(25_000_000)).toBe(5);
  });
});

describe("NodeProcessMetrics", () => {
  it("reports the lag net of the resolution and resets the histogram after reading", () => {
    const metrics: NodeProcessMetrics = new NodeProcessMetrics();
    const histogram: { mean: number; reset: jest.Mock } = { mean: 30_000_000, reset: jest.fn() };

    Object.assign(metrics, { _eventLoopDelay: histogram });

    const snapshot: ProcessMetricsSnapshot = metrics.snapshot();

    expect(snapshot.eventLoopLagMs).toBe(10);
    expect(histogram.reset).toHaveBeenCalledTimes(1);
  });
});
