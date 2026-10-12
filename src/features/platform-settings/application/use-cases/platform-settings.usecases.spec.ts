/*
 * Funcionalidad: Pruebas de los casos de uso de ajustes de la plataforma
 * Descripción: Verifica la actualización (límites duros 422, concurrencia optimista 409, proveedor de IA sin credenciales, auditoría SETTINGS_CHANGED en la transacción, invalidación de caché y notificación), el restablecimiento al valor por defecto y el listado por categoría con su origen
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { ResetPlatformSettingCommand } from "@/features/platform-settings/application/commands/reset-platform-setting.command";
import { UpdatePlatformSettingCommand } from "@/features/platform-settings/application/commands/update-platform-setting.command";
import { type PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { type PlatformSettingEntry, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import {
  buildTestDefaults,
  InMemoryAuditRecorder,
  InMemoryPlatformSettingsRepository,
  RollbackTransactionManager,
  StaticAiProviderAvailability,
  TEST_AI_USE_CASE,
} from "@/features/platform-settings/application/testing/platform-settings-test-doubles-spec";
import { GetPlatformSettingsUseCase } from "@/features/platform-settings/application/use-cases/get-platform-settings.usecase";
import { ResetPlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/reset-platform-setting.usecase";
import { UpdatePlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/update-platform-setting.usecase";
import {
  AiProviderNotConfiguredError,
  PlatformSettingHardLimitExceededError,
  PlatformSettingNotFoundError,
  PlatformSettingVersionConflictError,
} from "@/features/platform-settings/domain/platform-settings.errors";

interface Fixture {
  readonly repository: InMemoryPlatformSettingsRepository;
  readonly audit: InMemoryAuditRecorder;
  readonly store: PlatformSettingsStore;
  readonly update: UpdatePlatformSettingUseCase;
  readonly reset: ResetPlatformSettingUseCase;
  readonly list: GetPlatformSettingsUseCase;
}

async function buildFixture(
  configuredProviders: readonly string[] = ["gemini", "openai"],
  repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository(),
): Promise<Fixture> {
  const audit: InMemoryAuditRecorder = new InMemoryAuditRecorder();
  const store: PlatformSettingsStore = new PlatformSettingsStore(repository, buildTestDefaults());
  const transactions: RollbackTransactionManager = new RollbackTransactionManager(repository);

  await store.onModuleInit();

  return {
    repository,
    audit,
    store,
    update: new UpdatePlatformSettingUseCase(repository, transactions, audit, new StaticAiProviderAvailability(configuredProviders), store),
    reset: new ResetPlatformSettingUseCase(repository, transactions, audit, store),
    list: new GetPlatformSettingsUseCase(store),
  };
}

describe("UpdatePlatformSettingUseCase", () => {
  it("stores the override with the next version, audits SETTINGS_CHANGED in the transaction and notifies subscribers", async () => {
    const { repository, audit, store, update }: Fixture = await buildFixture();
    const received: number[] = [];

    store.subscribe("telemetry.flushIntervalMs", (value: number): void => {
      received.push(value);
    });

    await update.execute(new UpdatePlatformSettingCommand({ key: "telemetry.flushIntervalMs", value: 50, version: 0, performedBy: "admin-1" }));

    expect(repository.rows.get("telemetry.flushIntervalMs")).toMatchObject({ value: 50, version: 1, updatedById: "admin-1" });
    expect(repository.locks).toEqual(["platform-settings:key:telemetry.flushIntervalMs"]);
    expect(audit.entries).toEqual([
      {
        actorId: "admin-1",
        action: "SETTINGS_CHANGED",
        targetType: "platform_settings",
        targetId: "telemetry.flushIntervalMs",
        before: { value: 33, origin: "DEFAULT", version: 0 },
        after: { value: 50, origin: "OVERRIDE", version: 1 },
        transaction: "tx",
      },
    ]);
    expect(store.get("telemetry.flushIntervalMs")).toBe(50);
    expect(received).toEqual([50]);
  });

  it("rejects a stale version with PlatformSettingVersionConflictError (409) and changes nothing", async () => {
    const { repository, audit, store, update }: Fixture = await buildFixture();

    await update.execute(new UpdatePlatformSettingCommand({ key: "commands.ratePerSecond", value: 2, version: 0, performedBy: "admin-1" }));

    const stale: Promise<void> = update.execute(new UpdatePlatformSettingCommand({ key: "commands.ratePerSecond", value: 3, version: 0, performedBy: "admin-2" }));

    await expect(stale).rejects.toBeInstanceOf(PlatformSettingVersionConflictError);
    await expect(stale).rejects.toMatchObject({ details: { key: "commands.ratePerSecond", currentVersion: 1 } });
    expect(repository.rows.get("commands.ratePerSecond")).toMatchObject({ value: 2, version: 1 });
    expect(audit.entries).toHaveLength(1);
    expect(store.get("commands.ratePerSecond")).toBe(2);
  });

  it("rejects a value outside the hard limits (422) before touching the database", async () => {
    const { repository, audit, update }: Fixture = await buildFixture();

    const outOfLimits: Promise<void> = update.execute(new UpdatePlatformSettingCommand({ key: "commands.safety.maxPeep", value: 25, version: 0 }));

    await expect(outOfLimits).rejects.toBeInstanceOf(PlatformSettingHardLimitExceededError);
    expect(repository.rows.size).toBe(0);
    expect(repository.locks).toEqual([]);
    expect(audit.entries).toEqual([]);
  });

  it("rejects an unknown key", async () => {
    const { update }: Fixture = await buildFixture();

    await expect(update.execute(new UpdatePlatformSettingCommand({ key: "nope", value: 1, version: 0 }))).rejects.toBeInstanceOf(PlatformSettingNotFoundError);
  });

  it("rejects an AI provider without credentials entering a chain and rolls back", async () => {
    const { repository, audit, store, update }: Fixture = await buildFixture(["gemini"]);
    const value: unknown = { ...TEST_AI_USE_CASE, providerChain: ["gemini", "openai"] };

    const withoutCredentials: Promise<void> = update.execute(new UpdatePlatformSettingCommand({ key: "ai.useCase.FREE_CHAT", value, version: 0 }));

    await expect(withoutCredentials).rejects.toBeInstanceOf(AiProviderNotConfiguredError);
    await expect(withoutCredentials).rejects.toMatchObject({ details: { providers: ["openai"] } });
    expect(repository.rows.size).toBe(0);
    expect(audit.entries).toEqual([]);
    expect(store.get("ai.useCase.FREE_CHAT").providerChain).toEqual(["gemini"]);
  });

  it("keeps a provider already in the chain even without credentials when other fields change", async () => {
    const { store, update }: Fixture = await buildFixture([]);

    await update.execute(new UpdatePlatformSettingCommand({ key: "ai.useCase.FREE_CHAT", value: { ...TEST_AI_USE_CASE, timeoutMs: 10_000 }, version: 0 }));

    expect(store.get("ai.useCase.FREE_CHAT").timeoutMs).toBe(10_000);
  });
});

describe("ResetPlatformSettingUseCase", () => {
  it("replaces the override with a reset row on the next version, audits the return to the default and notifies subscribers", async () => {
    const { repository, audit, store, update, reset }: Fixture = await buildFixture();
    const received: boolean[] = [];

    await update.execute(new UpdatePlatformSettingCommand({ key: "ai.tutor.topicCheck.enabled", value: false, version: 0, performedBy: "admin-1" }));
    store.subscribe("ai.tutor.topicCheck.enabled", (value: boolean): void => {
      received.push(value);
    });

    await reset.execute(new ResetPlatformSettingCommand({ key: "ai.tutor.topicCheck.enabled", version: 1, performedBy: "admin-1" }));

    expect(repository.rows.get("ai.tutor.topicCheck.enabled")).toMatchObject({ value: null, version: 2, updatedById: "admin-1" });
    expect(audit.entries[1]).toMatchObject({
      action: "SETTINGS_CHANGED",
      before: { value: false, origin: "OVERRIDE", version: 1 },
      after: { value: true, origin: "DEFAULT", version: 2 },
    });
    expect(store.getEntry("ai.tutor.topicCheck.enabled")).toMatchObject({ value: true, origin: "DEFAULT", version: 2 });
    expect(received).toEqual([true]);
  });

  it("rejects a stale version with PlatformSettingVersionConflictError (409)", async () => {
    const { update, reset }: Fixture = await buildFixture();

    await update.execute(new UpdatePlatformSettingCommand({ key: "reservations.slotMinutes", value: 30, version: 0 }));

    await expect(reset.execute(new ResetPlatformSettingCommand({ key: "reservations.slotMinutes", version: 0 }))).rejects.toBeInstanceOf(
      PlatformSettingVersionConflictError,
    );
  });
});

describe("platform setting versions", () => {
  it("keeps versions monotonic across a reset, so a version read before it is rejected (no ABA)", async () => {
    const { store, update, reset }: Fixture = await buildFixture();
    const key: string = "reservations.slotMinutes";

    await update.execute(new UpdatePlatformSettingCommand({ key, value: 30, version: 0 }));
    const readVersion: number = store.getEntry("reservations.slotMinutes").version;

    await update.execute(new UpdatePlatformSettingCommand({ key, value: 20, version: readVersion }));
    await reset.execute(new ResetPlatformSettingCommand({ key, version: 2 }));
    await update.execute(new UpdatePlatformSettingCommand({ key, value: 10, version: 3 }));

    expect(readVersion).toBe(1);
    expect(store.getEntry("reservations.slotMinutes")).toMatchObject({ value: 10, origin: "OVERRIDE", version: 4 });
    await expect(update.execute(new UpdatePlatformSettingCommand({ key, value: 5, version: readVersion }))).rejects.toBeInstanceOf(
      PlatformSettingVersionConflictError,
    );
  });

  it("serves a reset setting as the default with its real version", async () => {
    const { store, update, reset }: Fixture = await buildFixture();

    await update.execute(new UpdatePlatformSettingCommand({ key: "reservations.slotMinutes", value: 30, version: 0 }));
    await reset.execute(new ResetPlatformSettingCommand({ key: "reservations.slotMinutes", version: 1 }));

    expect(store.getEntry("reservations.slotMinutes")).toMatchObject({ value: 15, origin: "DEFAULT", version: 2 });
  });

  it("exposes the real version of a stored override that no longer validates, so it can be reset and updated", async () => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
    const repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository();

    repository.rows.set("telemetry.flushIntervalMs", { key: "telemetry.flushIntervalMs", value: 5000, version: 7, updatedAt: new Date("2026-10-11T12:00:00.000Z") });
    const { store, update, reset }: Fixture = await buildFixture(["gemini"], repository);

    const entry: PlatformSettingEntry = store.getEntry("telemetry.flushIntervalMs");
    await reset.execute(new ResetPlatformSettingCommand({ key: "telemetry.flushIntervalMs", version: entry.version }));
    await update.execute(new UpdatePlatformSettingCommand({ key: "telemetry.flushIntervalMs", value: 50, version: 8 }));

    expect(entry).toMatchObject({ value: 33, origin: "DEFAULT", version: 7 });
    expect(store.getEntry("telemetry.flushIntervalMs")).toMatchObject({ value: 50, origin: "OVERRIDE", version: 9 });
    jest.restoreAllMocks();
  });
});

describe("GetPlatformSettingsUseCase", () => {
  it("lists a category with effective value, origin, default, limits and version", async () => {
    const { update, list }: Fixture = await buildFixture();

    await update.execute(new UpdatePlatformSettingCommand({ key: "telemetry.staleAfterMs", value: 5000, version: 0 }));
    const views: PlatformSettingView[] = list.execute("telemetry");

    expect(views.map((view: PlatformSettingView): string => view.key)).toEqual([
      "telemetry.flushIntervalMs",
      "telemetry.staleAfterMs",
      "telemetry.recordingHz",
      "telemetry.recordingFlushSeconds",
    ]);
    expect(views[1]).toMatchObject({ value: 5000, defaultValue: 2000, origin: "OVERRIDE", version: 1, limits: { min: 250, max: 600_000, integer: true } });
    expect(views[0]).toMatchObject({ value: 33, origin: "DEFAULT", version: 0 });
  });
});
