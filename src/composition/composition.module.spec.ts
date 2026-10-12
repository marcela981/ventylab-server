/*
 * Funcionalidad: Pruebas de la raíz de composición
 * Descripción: Compila CompositionModule con dependencias globales falsas para verificar que cada puerto de ajustes de las features se resuelve, que el arranque sin la tabla platform_settings sirve los valores por defecto del entorno y que los puertos leen el valor vigente tras una actualización sin reiniciar; verifica además la conversión de precios y la disponibilidad de proveedores de IA
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";

import { TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN } from "@/common/application/ports/audit-recorder.interface";
import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { createAiProviderAvailability, toPerMillionPriceTable } from "@/composition/adapters/ai-settings.adapters";
import { CompositionModule } from "@/composition/composition.module";
import { readPlatformSettingDefaults } from "@/composition/platform-setting-defaults";
import { AI_SETTINGS_PROVIDER_TOKEN, type IAiSettingsProvider } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AI_PRICE_TABLE_TOKEN, type IAiPriceTableProvider } from "@/features/ai-telemetry/application/ports/ai-price-table.interface";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { type IAiProviderAvailability } from "@/features/platform-settings/application/ports/ai-provider-availability.interface";
import { type PlatformSettingDefaults } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import { PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { SIMULATION_SESSION_SETTINGS_TOKEN, type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import {
  VENTILATOR_COMMANDS_SETTINGS_TOKEN,
  type VentilatorCommandsSettings,
} from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import {
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  type VentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";

const UPDATED_AT: Date = new Date("2026-10-11T12:00:00.000Z");

function fakeConfig(overrides: Partial<Record<keyof EnvironmentVariables, unknown>> = {}): ConfigService<EnvironmentVariables, true> {
  const values: Record<string, unknown> = { ...new EnvironmentVariables(), VENTILATOR_FLUSH_INTERVAL_MS: 40, RESERVATION_SLOT_MINUTES: 30, ...overrides };

  return { get: (key: string): unknown => values[key] } as unknown as ConfigService<EnvironmentVariables, true>;
}

const missingTablePrisma: unknown = {
  platformSetting: {
    findMany: (): Promise<never> =>
      Promise.reject(new Prisma.PrismaClientKnownRequestError("The table `public.platform_settings` does not exist", { code: "P2021", clientVersion: "6" })),
  },
};

@Global()
@Module({
  providers: [
    { provide: ConfigService, useValue: fakeConfig() },
    { provide: PrismaService, useValue: missingTablePrisma },
    { provide: TRANSACTION_MANAGER_TOKEN, useValue: { run: (work: (transaction: unknown) => Promise<unknown>): Promise<unknown> => work("tx") } },
    { provide: AUDIT_RECORDER_TOKEN, useValue: { record: (): Promise<void> => Promise.resolve() } },
  ],
  exports: [ConfigService, PrismaService, TRANSACTION_MANAGER_TOKEN, AUDIT_RECORDER_TOKEN],
})
class FakeGlobalsModule {}

describe("CompositionModule", () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
    moduleRef = await Test.createTestingModule({ imports: [FakeGlobalsModule, CompositionModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: (): boolean => true })
      .compile();
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef.close();
    jest.restoreAllMocks();
  });

  it("boots without the platform_settings table and serves the environment defaults through every settings port", () => {
    const telemetry: VentilatorTelemetrySettings = moduleRef.get(VENTILATOR_TELEMETRY_SETTINGS_TOKEN);
    const reservations: ReservationSettings = moduleRef.get(RESERVATION_SETTINGS_TOKEN);
    const commands: VentilatorCommandsSettings = moduleRef.get(VENTILATOR_COMMANDS_SETTINGS_TOKEN);
    const simulation: SimulationSessionSettings = moduleRef.get(SIMULATION_SESSION_SETTINGS_TOKEN);
    const grading: EvaluationGradingConfig = moduleRef.get(EVALUATION_GRADING_CONFIG_TOKEN);
    const ai: IAiSettingsProvider = moduleRef.get(AI_SETTINGS_PROVIDER_TOKEN);
    const prices: IAiPriceTableProvider = moduleRef.get(AI_PRICE_TABLE_TOKEN);

    expect([telemetry.flushIntervalMs, reservations.slotMinutes, commands.ratePerSecond, simulation.abandonAfterMs, grading.submitGraceMs]).toEqual([
      40,
      30,
      5,
      30 * 60_000,
      30_000,
    ]);
    expect(simulation.allowedTimeMultipliers).toEqual([1, 2, 4]);
    expect(ai.getTutorSettings().topicCheckEnabled).toBe(true);
    expect(ai.getUseCaseSettings("FREE_CHAT").providerChain.length).toBeGreaterThan(0);
    expect(prices.getPriceTable()["gemini:gemini-2.5-flash"]).toEqual({ inputPerMillionUsd: 0.3, outputPerMillionUsd: 2.5 });
  });

  it("makes the settings ports read the new value after an update, without a restart", () => {
    const store: PlatformSettingsStore = moduleRef.get(PlatformSettingsStore, { strict: false });
    const telemetry: VentilatorTelemetrySettings = moduleRef.get(VENTILATOR_TELEMETRY_SETTINGS_TOKEN);
    const commands: VentilatorCommandsSettings = moduleRef.get(VENTILATOR_COMMANDS_SETTINGS_TOKEN);
    const ai: IAiSettingsProvider = moduleRef.get(AI_SETTINGS_PROVIDER_TOKEN);

    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 100, version: 1, updatedAt: UPDATED_AT });
    store.applyOverride({ key: "commands.safety.maxPeep", value: 12, version: 1, updatedAt: UPDATED_AT });
    store.applyOverride({ key: "ai.tutor.topicCheck.enabled", value: false, version: 1, updatedAt: UPDATED_AT });

    expect([telemetry.flushIntervalMs, commands.safety.maxPeep, ai.getTutorSettings().topicCheckEnabled]).toEqual([100, 12, false]);
  });
});

describe("readPlatformSettingDefaults", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("accepts every environment and code default without logging an error", () => {
    const errorSpy: jest.SpyInstance = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);

    const defaults: PlatformSettingDefaults = readPlatformSettingDefaults(fakeConfig());

    expect(defaults["telemetry.flushIntervalMs"]).toBe(40);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs an error and clamps a configured default outside the hard limits instead of failing the boot", () => {
    const errorSpy: jest.SpyInstance = jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);

    const defaults: PlatformSettingDefaults = readPlatformSettingDefaults(fakeConfig({ VENTILATOR_FLUSH_INTERVAL_MS: 5000, SIMULATION_ABANDON_AFTER_MINUTES: 0 }));

    expect([defaults["telemetry.flushIntervalMs"], defaults["simulation.abandonAfterMinutes"]]).toEqual([1000, 1]);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("telemetry.flushIntervalMs"));
  });
});

describe("AI settings adapters", () => {
  it("converts prices per 1k tokens to the per-million telemetry table keyed by provider and model", () => {
    expect(toPerMillionPriceTable({ openai: { "gpt-4o-mini": { inputPer1kUsd: 0.00015, outputPer1kUsd: 0.0006 } } })).toEqual({
      "openai:gpt-4o-mini": { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
    });
  });

  it("reports a provider as configured only when its credentials exist", () => {
    const availability: IAiProviderAvailability = createAiProviderAvailability(fakeConfig({ GEMINI_API_KEY: "test-key" }));

    expect([availability.isConfigured("gemini"), availability.isConfigured("openai"), availability.isConfigured("custom")]).toEqual([true, false, false]);
  });
});
