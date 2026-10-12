/*
 * Funcionalidad: Pruebas de SystemStatusController y ProbeAiProviderUseCase
 * Descripción: Verifica los metadatos RBAC (system:status para TEACHER y ADMIN, system:probe solo para ADMIN), el límite de 3 sondas por minuto, y que la sonda pasa por AiGateway (llamada registrada en la telemetría), responde 404 para un proveedor desconocido y 422 para uno sin configuración
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpStatus, Logger } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";

import { DOMAIN_ERROR_STATUS_MAP } from "@/common/presentation/errors-map";
import { AiProviderNotRegisteredError, UnknownAiProviderError } from "@/features/ai/domain/ai.errors";
import { type AiProbeResult } from "@/features/ai/domain/results/ai-provider-health";
import { PERMISSIONS_KEY } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";
import { createSystemStatusHarness, type SystemStatusHarness } from "@/features/system-status/application/testing/system-status-test-doubles-spec";
import { ProbeAiProviderUseCase } from "@/features/system-status/application/use-cases/probe-ai-provider.usecase";
import { AI_PROBE_RATE_LIMIT, AI_PROBE_RATE_WINDOW_MS, SystemStatusController } from "@/features/system-status/presentation/controllers/system-status.controller";

function handler(name: keyof SystemStatusController): object {
  return SystemStatusController.prototype[name];
}

describe("SystemStatusController authorization", () => {
  it("guards every route with JWT and permissions", () => {
    const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, SystemStatusController);

    expect(guards).toEqual([JwtAuthGuard, PermissionsGuard]);
  });

  it("requires system:status to read the status, granted to teachers and admins only", () => {
    const permissions: string[] = Reflect.getMetadata(PERMISSIONS_KEY, handler("getSystemStatus"));

    expect(permissions).toEqual(["system:status"]);
    expect(ROLE_PERMISSIONS.ADMIN).toContain("system:status");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("system:status");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("system:status");
  });

  it("requires system:probe to probe a provider, granted to admins only, and throttles it", () => {
    const permissions: string[] = Reflect.getMetadata(PERMISSIONS_KEY, handler("probeAiProvider"));
    const limit: number = Reflect.getMetadata("THROTTLER:LIMITdefault", handler("probeAiProvider"));
    const ttl: number = Reflect.getMetadata("THROTTLER:TTLdefault", handler("probeAiProvider"));

    expect(permissions).toEqual(["system:probe"]);
    expect(ROLE_PERMISSIONS.ADMIN).toContain("system:probe");
    expect(ROLE_PERMISSIONS.TEACHER).not.toContain("system:probe");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("system:probe");
    expect(limit).toBe(AI_PROBE_RATE_LIMIT);
    expect(ttl).toBe(AI_PROBE_RATE_WINDOW_MS);
  });
});

describe("ProbeAiProviderUseCase", () => {
  let harness: SystemStatusHarness;
  let useCase: ProbeAiProviderUseCase;

  beforeEach(() => {
    harness = createSystemStatusHarness();
    useCase = new ProbeAiProviderUseCase(harness.gateway, harness.monitor);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("goes through the AI gateway, records the call in telemetry and re-evaluates the status", async () => {
    const refresh: jest.SpyInstance = jest.spyOn(harness.service, "refresh");

    const result: AiProbeResult = await useCase.execute("gemini");

    expect(result).toMatchObject({ provider: "gemini", ok: true });
    expect(harness.llm.calls).toBe(1);
    expect(harness.aiCalls.last).toMatchObject({ id: result.aiCallId, provider: "gemini", status: "SUCCESS", refType: "health_probe" });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("maps an unknown provider to 404", async () => {
    const probing: Promise<AiProbeResult> = useCase.execute("unknown-provider");

    await expect(probing).rejects.toBeInstanceOf(UnknownAiProviderError);
    expect(DOMAIN_ERROR_STATUS_MAP.get(UnknownAiProviderError)).toBe(HttpStatus.NOT_FOUND);
  });

  it("maps a provider without configuration to 422", async () => {
    const probing: Promise<AiProbeResult> = useCase.execute("anthropic");

    await expect(probing).rejects.toBeInstanceOf(AiProviderNotRegisteredError);
    expect(DOMAIN_ERROR_STATUS_MAP.get(AiProviderNotRegisteredError)).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(harness.llm.calls).toBe(0);
  });
});
