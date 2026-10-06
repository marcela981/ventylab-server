/*
 * Funcionalidad: Mapeador de persistencia de la bitácora de llamadas de IA
 * Descripción: Convierte entre las filas Prisma de ai_call_logs (y las filas crudas de los agregados con percentiles) y los modelos de lectura de la telemetría: nulos a undefined, bigint y Decimal a number
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallLog as AiCallLogModel, type Prisma } from "@prisma/client";

import {
  type AiCallLogEntry,
  type AiCallLogRow,
  type AiCallSummary,
  type AiTelemetryAggregate,
  NO_PROVIDER,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

export interface RawAiTelemetryAggregate {
  readonly calls: bigint | number | null;
  readonly provider_calls: bigint | number | null;
  readonly fallback_calls: bigint | number | null;
  readonly error_calls: bigint | number | null;
  readonly latency_p50: number | null;
  readonly latency_p95: number | null;
  readonly ttft_p50: number | null;
  readonly ttft_p95: number | null;
  readonly input_tokens: bigint | number | null;
  readonly output_tokens: bigint | number | null;
  readonly cost_usd: Prisma.Decimal | number | string | null;
}

export interface RawAiTelemetryDayAggregate extends RawAiTelemetryAggregate {
  readonly day: string;
}

export type AiCallSummaryModel = Pick<AiCallLogModel, "id" | "userId" | "useCase" | "provider" | "model" | "promptVersion" | "status" | "createdAt">;

export type AiCallLogRowModel = Omit<AiCallLogModel, "userId" | "promptHash">;

export const EMPTY_RAW_AGGREGATE: RawAiTelemetryAggregate = {
  calls: 0,
  provider_calls: 0,
  fallback_calls: 0,
  error_calls: 0,
  latency_p50: null,
  latency_p95: null,
  ttft_p50: null,
  ttft_p95: null,
  input_tokens: 0,
  output_tokens: 0,
  cost_usd: 0,
};

function toNumber(value: bigint | number | Prisma.Decimal | string | null): number {
  if (value === null) {
    return 0;
  }

  return Number(value.toString());
}

function toOptionalNumber(value: number | Prisma.Decimal | null): number | undefined {
  return value === null ? undefined : Number(value.toString());
}

export class AiCallLogsMapper {
  public static toPersistence(entry: AiCallLogEntry): Prisma.AiCallLogUncheckedCreateInput {
    return {
      id: entry.id,
      userId: entry.userId ?? null,
      useCase: entry.useCase,
      provider: entry.provider ?? NO_PROVIDER,
      model: entry.model ?? null,
      promptVersion: entry.promptVersion,
      promptHash: entry.promptHash,
      inputTokens: entry.inputTokens ?? null,
      outputTokens: entry.outputTokens ?? null,
      latencyMs: entry.latencyMs,
      ttftMs: entry.ttftMs ?? null,
      status: entry.status,
      errorCode: entry.errorCode ?? null,
      attempts: entry.attempts,
      costEstimateUsd: entry.costEstimateUsd ?? null,
      refType: entry.refType ?? null,
      refId: entry.refId ?? null,
      ...(entry.createdAt ? { createdAt: entry.createdAt } : {}),
    };
  }

  public static toAggregate(raw: RawAiTelemetryAggregate): AiTelemetryAggregate {
    return {
      calls: toNumber(raw.calls),
      providerCalls: toNumber(raw.provider_calls),
      fallbackCalls: toNumber(raw.fallback_calls),
      errorCalls: toNumber(raw.error_calls),
      latencyP50Ms: toOptionalNumber(raw.latency_p50),
      latencyP95Ms: toOptionalNumber(raw.latency_p95),
      ttftP50Ms: toOptionalNumber(raw.ttft_p50),
      ttftP95Ms: toOptionalNumber(raw.ttft_p95),
      inputTokens: toNumber(raw.input_tokens),
      outputTokens: toNumber(raw.output_tokens),
      costUsd: toNumber(raw.cost_usd),
    };
  }

  public static toRow(row: AiCallLogRowModel): AiCallLogRow {
    return {
      id: row.id,
      createdAt: row.createdAt,
      useCase: row.useCase,
      provider: row.provider,
      model: row.model ?? undefined,
      promptVersion: row.promptVersion,
      status: row.status,
      errorCode: row.errorCode ?? undefined,
      attempts: row.attempts,
      inputTokens: row.inputTokens ?? undefined,
      outputTokens: row.outputTokens ?? undefined,
      latencyMs: row.latencyMs,
      ttftMs: row.ttftMs ?? undefined,
      costEstimateUsd: toOptionalNumber(row.costEstimateUsd),
      refType: row.refType ?? undefined,
      refId: row.refId ?? undefined,
    };
  }

  public static toSummary(row: AiCallSummaryModel): AiCallSummary {
    return {
      id: row.id,
      userId: row.userId ?? undefined,
      useCase: row.useCase,
      provider: row.provider,
      model: row.model ?? undefined,
      promptVersion: row.promptVersion,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
