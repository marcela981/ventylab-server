/*
 * Funcionalidad: Pruebas del repositorio Prisma de la bitácora de llamadas de IA
 * Descripción: Verifica con un cliente Prisma simulado la inserción sin texto, el filtro de consumo (solo estados que llegaron a un proveedor), el mapeo de los agregados con percentiles devueltos por $queryRaw (bigint, numeric y nulos) y el resumen de una llamada
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma } from "@prisma/client";

import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type AiCallLogRow,
  type AiCallSummary,
  type AiTelemetryAggregate,
  type AiTelemetryDayAggregate,
  type AiTelemetryFilters,
  type AiUsage,
} from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { AiCallLogsPrismaRepository } from "@/features/ai-telemetry/infrastructure/persistence/prisma/repositories/ai-call-logs-prisma.repository";

interface PrismaMock {
  $queryRaw: jest.Mock;
  aiCallLog: { create: jest.Mock; aggregate: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; findFirst: jest.Mock };
}

const FILTERS: AiTelemetryFilters = {
  from: new Date("2026-10-01T00:00:00Z"),
  to: new Date("2026-10-05T00:00:00Z"),
  useCase: "FREE_CHAT",
  provider: "gemini",
};

const RAW_AGGREGATE: Record<string, unknown> = {
  calls: BigInt(12),
  provider_calls: BigInt(10),
  fallback_calls: BigInt(2),
  error_calls: BigInt(1),
  latency_p50: 812.5,
  latency_p95: 2400,
  ttft_p50: null,
  ttft_p95: null,
  input_tokens: BigInt(5000),
  output_tokens: BigInt(2000),
  cost_usd: new Prisma.Decimal("0.012300"),
};

describe("AiCallLogsPrismaRepository", () => {
  let prisma: PrismaMock;
  let repository: AiCallLogsPrismaRepository;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn(),
      aiCallLog: { create: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    };
    repository = new AiCallLogsPrismaRepository(prisma as unknown as PrismaService);
  });

  it("inserts the entry with the caller id and defaults a missing provider to none", async () => {
    await repository.create({
      id: "call-1",
      useCase: "TOPIC_CHECK",
      promptVersion: "topic-check@1",
      promptHash: "h",
      latencyMs: 0,
      status: "QUOTA_EXCEEDED",
      attempts: 0,
    });

    expect(prisma.aiCallLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: "call-1", provider: "none", userId: null, model: null, costEstimateUsd: null }),
    });
  });

  it("counts usage only for statuses that reached a provider", async () => {
    const since: Date = new Date("2026-10-05T00:00:00Z");

    prisma.aiCallLog.aggregate.mockResolvedValue({ _count: { _all: 4 }, _sum: { inputTokens: 40, outputTokens: null } });

    const usage: AiUsage = await repository.getUsage("user-1", "FREE_CHAT", since);

    expect(usage).toEqual({ requests: 4, inputTokens: 40, outputTokens: 0 });
    expect(prisma.aiCallLog.aggregate).toHaveBeenCalledWith({
      where: { userId: "user-1", useCase: "FREE_CHAT", createdAt: { gte: since }, status: { in: ["SUCCESS", "FALLBACK", "ERROR", "ABORTED"] } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true },
    });
  });

  it("maps the raw totals, converting bigint and decimal values and keeping missing percentiles undefined", async () => {
    prisma.$queryRaw.mockResolvedValue([RAW_AGGREGATE]);

    const aggregate: AiTelemetryAggregate = await repository.getAggregate(FILTERS);

    expect(aggregate).toEqual({
      calls: 12,
      providerCalls: 10,
      fallbackCalls: 2,
      errorCalls: 1,
      latencyP50Ms: 812.5,
      latencyP95Ms: 2400,
      ttftP50Ms: undefined,
      ttftP95Ms: undefined,
      inputTokens: 5000,
      outputTokens: 2000,
      costUsd: 0.0123,
    });
  });

  it("passes the filters as SQL parameters, never inlined in the query text", async () => {
    prisma.$queryRaw.mockResolvedValue([RAW_AGGREGATE]);

    await repository.getAggregate({ ...FILTERS, model: "x'; DROP TABLE ai_call_logs; --" });

    const query: Prisma.Sql = prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql;

    expect(query.sql).toContain("percentile_cont");
    expect(query.sql).not.toContain("DROP TABLE");
    expect(query.values).toEqual(expect.arrayContaining([FILTERS.from, FILTERS.to, "FREE_CHAT", "gemini", "x'; DROP TABLE ai_call_logs; --"]));
  });

  it("returns zeroed totals when the query returns no row", async () => {
    prisma.$queryRaw.mockResolvedValue([]);

    const aggregate: AiTelemetryAggregate = await repository.getAggregate(FILTERS);

    expect(aggregate.calls).toBe(0);
    expect(aggregate.costUsd).toBe(0);
    expect(aggregate.latencyP50Ms).toBeUndefined();
  });

  it("maps one aggregate per day", async () => {
    prisma.$queryRaw.mockResolvedValue([
      { ...RAW_AGGREGATE, day: "2026-10-01" },
      { ...RAW_AGGREGATE, day: "2026-10-02", calls: BigInt(1), ttft_p50: 150, cost_usd: null },
    ]);

    const days: AiTelemetryDayAggregate[] = await repository.getDailyAggregates(FILTERS);

    expect(days.map((day: AiTelemetryDayAggregate) => day.day)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(days[1].calls).toBe(1);
    expect(days[1].ttftP50Ms).toBe(150);
    expect(days[1].costUsd).toBe(0);
    expect((prisma.$queryRaw.mock.calls[0][0] as Prisma.Sql).sql).toContain("GROUP BY");
  });

  it("reads export rows ordered by creation with the row limit and no text columns", async () => {
    const createdAt: Date = new Date("2026-10-02T00:00:00Z");

    prisma.aiCallLog.findMany.mockResolvedValue([
      {
        id: "call-1",
        createdAt,
        useCase: "LESSON_QA",
        provider: "openai",
        model: null,
        promptVersion: "lesson-qa@1",
        status: "SUCCESS",
        errorCode: null,
        attempts: 1,
        inputTokens: 1,
        outputTokens: 2,
        latencyMs: 3,
        ttftMs: null,
        costEstimateUsd: new Prisma.Decimal("0.5"),
        refType: null,
        refId: null,
      },
    ]);

    const rows: AiCallLogRow[] = await repository.getRows(FILTERS, 100);

    expect(rows[0]).toEqual(expect.objectContaining({ id: "call-1", model: undefined, ttftMs: undefined, costEstimateUsd: 0.5 }));
    expect(prisma.aiCallLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdAt: { gte: FILTERS.from, lt: FILTERS.to }, useCase: "FREE_CHAT", provider: "gemini" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 100,
      }),
    );
  });

  it("returns the call summary or undefined", async () => {
    const createdAt: Date = new Date();

    prisma.aiCallLog.findUnique
      .mockResolvedValueOnce({
        id: "call-1",
        userId: null,
        useCase: "FREE_CHAT",
        provider: "gemini",
        model: "m",
        promptVersion: "v1",
        status: "SUCCESS",
        createdAt,
      })
      .mockResolvedValueOnce(null);

    const found: AiCallSummary | undefined = await repository.getById("call-1");
    const missing: AiCallSummary | undefined = await repository.getById("call-2");

    expect(found).toEqual({ id: "call-1", userId: undefined, useCase: "FREE_CHAT", provider: "gemini", model: "m", promptVersion: "v1", status: "SUCCESS", createdAt });
    expect(missing).toBeUndefined();
  });

  it("returns the latest successful or fallback call linked to a reference, or undefined", async () => {
    const createdAt: Date = new Date();

    prisma.aiCallLog.findFirst
      .mockResolvedValueOnce({
        id: "call-9",
        userId: null,
        useCase: "GRADE_FEEDBACK",
        provider: "openai",
        model: "m",
        promptVersion: "1.0.0",
        status: "FALLBACK",
        createdAt,
      })
      .mockResolvedValueOnce(null);

    const found: AiCallSummary | undefined = await repository.getLatestByRef("evaluation_attempt", "attempt-1", ["SUCCESS", "FALLBACK"]);
    const missing: AiCallSummary | undefined = await repository.getLatestByRef("evaluation_attempt", "attempt-2", ["SUCCESS", "FALLBACK"]);

    expect(found).toEqual(expect.objectContaining({ id: "call-9", status: "FALLBACK" }));
    expect(missing).toBeUndefined();
    expect(prisma.aiCallLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { refType: "evaluation_attempt", refId: "attempt-1", status: { in: ["SUCCESS", "FALLBACK"] } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });
});
