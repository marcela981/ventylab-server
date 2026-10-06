/*
 * Funcionalidad: Pruebas de las reglas de métricas de telemetría de IA
 * Descripción: Verifica la validación del rango de fechas (inicio antes del fin, máximo 366 días), el cálculo de tasas de fallback y error sobre las llamadas que llegaron a un proveedor y la estimación de costo por tabla de precios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidAiTelemetryRangeError } from "@/features/ai-telemetry/domain/ai-telemetry.errors";
import { type AiTelemetryAggregate, type AiTelemetryMetrics } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import {
  assertValidTelemetryRange,
  estimateAiCallCostUsd,
  toTelemetryMetrics,
} from "@/features/ai-telemetry/domain/services/ai-telemetry-metrics";

const AGGREGATE: AiTelemetryAggregate = {
  calls: 12,
  providerCalls: 10,
  fallbackCalls: 2,
  errorCalls: 1,
  latencyP50Ms: 800,
  latencyP95Ms: 2400,
  ttftP50Ms: 200,
  ttftP95Ms: 600,
  inputTokens: 5000,
  outputTokens: 2000,
  costUsd: 0.0123,
};

describe("assertValidTelemetryRange", () => {
  it("accepts a range of exactly 366 days", () => {
    const from: Date = new Date("2025-10-05T00:00:00Z");
    const to: Date = new Date("2026-10-06T00:00:00Z");

    expect(() => assertValidTelemetryRange(from, to)).not.toThrow();
  });

  it("rejects a range longer than 366 days", () => {
    const from: Date = new Date("2025-10-05T00:00:00Z");
    const to: Date = new Date("2026-10-06T00:00:01Z");

    expect(() => assertValidTelemetryRange(from, to)).toThrow(InvalidAiTelemetryRangeError);
  });

  it("rejects a range that does not start before it ends", () => {
    const date: Date = new Date("2026-10-05T00:00:00Z");

    expect(() => assertValidTelemetryRange(date, date)).toThrow(InvalidAiTelemetryRangeError);
  });
});

describe("toTelemetryMetrics", () => {
  it("computes the fallback and error rates over the calls that reached a provider", () => {
    const metrics: AiTelemetryMetrics = toTelemetryMetrics(AGGREGATE);

    expect(metrics.fallbackRate).toBe(0.2);
    expect(metrics.errorRate).toBe(0.1);
    expect(metrics.calls).toBe(12);
  });

  it("returns zero rates when no call reached a provider", () => {
    const metrics: AiTelemetryMetrics = toTelemetryMetrics({ ...AGGREGATE, providerCalls: 0, fallbackCalls: 0, errorCalls: 0 });

    expect(metrics.fallbackRate).toBe(0);
    expect(metrics.errorRate).toBe(0);
  });
});

describe("estimateAiCallCostUsd", () => {
  it("prices input and output tokens per million for the provider and model", () => {
    const cost: number | undefined = estimateAiCallCostUsd(
      { "openai:gpt-4o-mini": { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 } },
      "openai",
      "gpt-4o-mini",
      2000,
      1000,
    );

    expect(cost).toBeCloseTo(0.0009, 10);
  });

  it("returns undefined without a price or without tokens", () => {
    expect(estimateAiCallCostUsd({}, "openai", "gpt-4o-mini", 10, 10)).toBeUndefined();
    expect(estimateAiCallCostUsd({ "openai:x": { inputPerMillionUsd: 1, outputPerMillionUsd: 1 } }, "openai", "x", undefined, undefined)).toBeUndefined();
    expect(estimateAiCallCostUsd({ "openai:x": { inputPerMillionUsd: 1, outputPerMillionUsd: 1 } }, "openai", undefined, 10, 10)).toBeUndefined();
  });
});
