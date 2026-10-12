/*
 * Funcionalidad: Repositorio Prisma de la bitácora de llamadas de IA
 * Descripción: Implementa IAiCallLogsRepository sobre ai_call_logs con PrismaService: inserción con el id del llamador, consumo por usuario y caso de uso, agregados con percentile_cont (totales, por día UTC y por proveedor con p95 de latencia y tasa de error desde un instante) mediante $queryRaw parametrizado, filas para exportar, resumen de una llamada y la última llamada enlazada a una referencia (refType/refId) con ciertos estados; el consumo, los agregados y la exportación excluyen las sondas de salud de los proveedores, que sí cuentan en las métricas por proveedor
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AiCallLogEntry,
  type AiCallLogRow,
  type AiCallStatusValue,
  type AiCallSummary,
  type AiProviderTelemetry,
  type AiTelemetryAggregate,
  type AiTelemetryDayAggregate,
  type AiTelemetryFilters,
  type AiTelemetryUseCaseValue,
  type AiUsage,
  NO_PROVIDER,
  PROVIDER_REACHING_STATUSES,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { type IAiCallLogsRepository } from "@/features/ai-telemetry/domain/repositories/ai-call-logs.repository";
import { EXCLUDE_HEALTH_PROBES_SQL, EXCLUDE_HEALTH_PROBES_WHERE } from "@/features/ai-telemetry/infrastructure/persistence/prisma/filters/health-probe-exclusion";
import {
  type AiCallLogRowModel,
  AiCallLogsMapper,
  type AiCallSummaryModel,
  EMPTY_RAW_AGGREGATE,
  type RawAiTelemetryAggregate,
  type RawAiTelemetryDayAggregate,
} from "@/features/ai-telemetry/infrastructure/persistence/prisma/mappers/ai-call-logs.mapper";

const PROVIDER_REACHING_SQL: Prisma.Sql = Prisma.sql`status IN ('SUCCESS', 'FALLBACK', 'ERROR', 'ABORTED')`;

// Latency and TTFT percentiles only consider calls that reached a provider; quota rejections and off-topic blocks would skew them toward zero.
const AGGREGATE_COLUMNS: Prisma.Sql = Prisma.sql`
  count(*) AS calls,
  count(*) FILTER (WHERE ${PROVIDER_REACHING_SQL}) AS provider_calls,
  count(*) FILTER (WHERE status = 'FALLBACK') AS fallback_calls,
  count(*) FILTER (WHERE status = 'ERROR') AS error_calls,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) FILTER (WHERE ${PROVIDER_REACHING_SQL}) AS latency_p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) FILTER (WHERE ${PROVIDER_REACHING_SQL}) AS latency_p95,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY ttft_ms) FILTER (WHERE ttft_ms IS NOT NULL) AS ttft_p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY ttft_ms) FILTER (WHERE ttft_ms IS NOT NULL) AS ttft_p95,
  coalesce(sum(input_tokens), 0)::bigint AS input_tokens,
  coalesce(sum(output_tokens), 0)::bigint AS output_tokens,
  coalesce(sum(cost_estimate_usd), 0) AS cost_usd
`;

interface RawAiProviderTelemetry {
  provider: string;
  provider_calls: bigint | number;
  error_calls: bigint | number;
  latency_p95: number | null;
}

const SUMMARY_SELECT: Record<keyof AiCallSummaryModel, true> = {
  id: true,
  userId: true,
  useCase: true,
  provider: true,
  model: true,
  promptVersion: true,
  status: true,
  createdAt: true,
};

const ROW_SELECT: Record<keyof AiCallLogRowModel, true> = {
  id: true,
  createdAt: true,
  useCase: true,
  provider: true,
  model: true,
  promptVersion: true,
  status: true,
  errorCode: true,
  attempts: true,
  inputTokens: true,
  outputTokens: true,
  latencyMs: true,
  ttftMs: true,
  costEstimateUsd: true,
  refType: true,
  refId: true,
};

@Injectable()
export class AiCallLogsPrismaRepository implements IAiCallLogsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async create(entry: AiCallLogEntry): Promise<void> {
    await this._prisma.aiCallLog.create({ data: AiCallLogsMapper.toPersistence(entry) });
  }

  public async getUsage(userId: string, useCase: AiTelemetryUseCaseValue, since: Date): Promise<AiUsage> {
    const result: { _count: { _all: number }; _sum: { inputTokens: number | null; outputTokens: number | null } } =
      await this._prisma.aiCallLog.aggregate({
        where: { userId, useCase, createdAt: { gte: since }, status: { in: [...PROVIDER_REACHING_STATUSES] }, AND: [EXCLUDE_HEALTH_PROBES_WHERE] },
        _count: { _all: true },
        _sum: { inputTokens: true, outputTokens: true },
      });

    return {
      requests: result._count._all,
      inputTokens: result._sum.inputTokens ?? 0,
      outputTokens: result._sum.outputTokens ?? 0,
    };
  }

  public async getAggregate(filters: AiTelemetryFilters): Promise<AiTelemetryAggregate> {
    const rows: RawAiTelemetryAggregate[] = await this._prisma.$queryRaw<RawAiTelemetryAggregate[]>(Prisma.sql`
      SELECT ${AGGREGATE_COLUMNS}
      FROM ai_call_logs
      WHERE ${this._whereSql(filters)}
    `);

    return AiCallLogsMapper.toAggregate(rows[0] ?? EMPTY_RAW_AGGREGATE);
  }

  public async getDailyAggregates(filters: AiTelemetryFilters): Promise<AiTelemetryDayAggregate[]> {
    const rows: RawAiTelemetryDayAggregate[] = await this._prisma.$queryRaw<RawAiTelemetryDayAggregate[]>(Prisma.sql`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, ${AGGREGATE_COLUMNS}
      FROM ai_call_logs
      WHERE ${this._whereSql(filters)}
      GROUP BY day
      ORDER BY day
    `);

    return rows.map((row: RawAiTelemetryDayAggregate): AiTelemetryDayAggregate => ({ ...AiCallLogsMapper.toAggregate(row), day: row.day }));
  }

  // Health probes stay in: they are real provider round trips, so a manual probe after an outage is part of the provider's recent error rate and latency.
  public async getProviderStats(since: Date): Promise<AiProviderTelemetry[]> {
    const rows: RawAiProviderTelemetry[] = await this._prisma.$queryRaw<RawAiProviderTelemetry[]>(Prisma.sql`
      SELECT provider,
        count(*) AS provider_calls,
        count(*) FILTER (WHERE status = 'ERROR') AS error_calls,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS latency_p95
      FROM ai_call_logs
      WHERE created_at >= ${since} AND ${PROVIDER_REACHING_SQL} AND provider <> ${NO_PROVIDER}
      GROUP BY provider
    `);

    return rows.map((row: RawAiProviderTelemetry): AiProviderTelemetry => {
      const providerCalls: number = Number(row.provider_calls);
      const errorCalls: number = Number(row.error_calls);

      return {
        provider: row.provider,
        providerCalls,
        errorCalls,
        errorRate: providerCalls > 0 ? errorCalls / providerCalls : 0,
        latencyP95Ms: row.latency_p95 === null ? undefined : Math.round(Number(row.latency_p95)),
      };
    });
  }

  public async getRows(filters: AiTelemetryFilters, limit: number): Promise<AiCallLogRow[]> {
    const rows: AiCallLogRowModel[] = await this._prisma.aiCallLog.findMany({
      where: {
        createdAt: { gte: filters.from, lt: filters.to },
        ...(filters.useCase ? { useCase: filters.useCase } : {}),
        ...(filters.provider ? { provider: filters.provider } : {}),
        ...(filters.model ? { model: filters.model } : {}),
        AND: [EXCLUDE_HEALTH_PROBES_WHERE],
      },
      select: ROW_SELECT,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });

    return rows.map((row: AiCallLogRowModel) => AiCallLogsMapper.toRow(row));
  }

  public async getById(id: string): Promise<AiCallSummary | undefined> {
    const row: AiCallSummaryModel | null = await this._prisma.aiCallLog.findUnique({ where: { id }, select: SUMMARY_SELECT });

    return row ? AiCallLogsMapper.toSummary(row) : undefined;
  }

  public async getLatestByRef(refType: string, refId: string, statuses: readonly AiCallStatusValue[]): Promise<AiCallSummary | undefined> {
    const row: AiCallSummaryModel | null = await this._prisma.aiCallLog.findFirst({
      where: { refType, refId, status: { in: [...statuses] } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: SUMMARY_SELECT,
    });

    return row ? AiCallLogsMapper.toSummary(row) : undefined;
  }

  private _whereSql(filters: AiTelemetryFilters): Prisma.Sql {
    const conditions: Prisma.Sql[] = [Prisma.sql`created_at >= ${filters.from}`, Prisma.sql`created_at < ${filters.to}`, EXCLUDE_HEALTH_PROBES_SQL];

    if (filters.useCase) {
      conditions.push(Prisma.sql`use_case = ${filters.useCase}::"AiUseCase"`);
    }

    if (filters.provider) {
      conditions.push(Prisma.sql`provider = ${filters.provider}`);
    }

    if (filters.model) {
      conditions.push(Prisma.sql`model = ${filters.model}`);
    }

    return Prisma.join(conditions, " AND ");
  }
}
