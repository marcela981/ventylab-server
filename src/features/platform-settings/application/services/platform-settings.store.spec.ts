/*
 * Funcionalidad: Pruebas de la caché de ajustes de la plataforma
 * Descripción: Verifica el valor efectivo con su origen, el arranque con la tabla ausente (valores por defecto), el descarte de sobrescrituras inválidas guardadas, la invalidación de la caché y la notificación a los suscriptores
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PlatformSettingsFacade } from "@/features/platform-settings/application/services/platform-settings.facade";
import { type PlatformSettingEntry, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { buildTestDefaults, InMemoryPlatformSettingsRepository } from "@/features/platform-settings/application/testing/platform-settings-test-doubles-spec";

const UPDATED_AT: Date = new Date("2026-10-11T12:00:00.000Z");

function buildStore(repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository()): PlatformSettingsStore {
  return new PlatformSettingsStore(repository, buildTestDefaults());
}

describe("PlatformSettingsStore", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serves the default with origin DEFAULT and version 0 when there is no override", async () => {
    const store: PlatformSettingsStore = buildStore();

    await store.onModuleInit();
    const entry: PlatformSettingEntry = store.getEntry("telemetry.flushIntervalMs");

    expect(entry).toEqual({ key: "telemetry.flushIntervalMs", value: 33, defaultValue: 33, origin: "DEFAULT", version: 0 });
  });

  it("serves a stored override with origin OVERRIDE and its version", async () => {
    const repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository();

    repository.rows.set("telemetry.flushIntervalMs", { key: "telemetry.flushIntervalMs", value: 50, version: 2, updatedById: "admin-1", updatedAt: UPDATED_AT });
    const store: PlatformSettingsStore = buildStore(repository);

    await store.onModuleInit();

    expect(store.getEntry("telemetry.flushIntervalMs")).toEqual({
      key: "telemetry.flushIntervalMs",
      value: 50,
      defaultValue: 33,
      origin: "OVERRIDE",
      version: 2,
      updatedAt: UPDATED_AT,
      updatedById: "admin-1",
    });
    expect(new PlatformSettingsFacade(store).get("telemetry.flushIntervalMs")).toBe(50);
  });

  it("boots with the defaults and a warning when the table does not exist yet", async () => {
    const repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository();

    repository.loadError = new Prisma.PrismaClientKnownRequestError("The table `public.platform_settings` does not exist", { code: "P2021", clientVersion: "6" });
    const store: PlatformSettingsStore = buildStore(repository);

    await expect(store.onModuleInit()).resolves.toBeUndefined();

    expect(store.get("reservations.slotMinutes")).toBe(15);
    expect(store.getEntry("reservations.slotMinutes").origin).toBe("DEFAULT");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("serving defaults"));
  });

  it("ignores unknown stored overrides and serves the default with the real version of one that breaks the hard limits", async () => {
    const repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository();

    repository.rows.set("telemetry.flushIntervalMs", { key: "telemetry.flushIntervalMs", value: 1, version: 4, updatedAt: UPDATED_AT });
    repository.rows.set("legacy.key", { key: "legacy.key", value: 1, version: 1, updatedAt: UPDATED_AT });
    const store: PlatformSettingsStore = buildStore(repository);

    await store.onModuleInit();

    expect(store.get("telemetry.flushIntervalMs")).toBe(33);
    expect(store.getEntry("telemetry.flushIntervalMs")).toMatchObject({ value: 33, origin: "DEFAULT", version: 4 });
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("serves a reset row as the default with its real version", async () => {
    const repository: InMemoryPlatformSettingsRepository = new InMemoryPlatformSettingsRepository();

    repository.rows.set("telemetry.flushIntervalMs", { key: "telemetry.flushIntervalMs", value: null, version: 3, updatedAt: UPDATED_AT });
    const store: PlatformSettingsStore = buildStore(repository);

    await store.onModuleInit();

    expect(store.get("telemetry.flushIntervalMs")).toBe(33);
    expect(store.getEntry("telemetry.flushIntervalMs")).toMatchObject({ value: 33, origin: "DEFAULT", version: 3 });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("ignores a row applied out of order whose version is not newer than the cached one", async () => {
    const store: PlatformSettingsStore = buildStore();
    const listener: jest.Mock = jest.fn();

    await store.onModuleInit();
    store.subscribe("telemetry.flushIntervalMs", listener);
    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 60, version: 3, updatedAt: UPDATED_AT });

    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 50, version: 2, updatedAt: UPDATED_AT });
    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 40, version: 3, updatedAt: UPDATED_AT });

    expect(store.getEntry("telemetry.flushIntervalMs")).toMatchObject({ value: 60, version: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("invalidates the cached value and notifies the key subscribers on apply and reset", async () => {
    const store: PlatformSettingsStore = buildStore();
    const facade: PlatformSettingsFacade = new PlatformSettingsFacade(store);
    const received: number[] = [];
    const otherKey: jest.Mock = jest.fn();

    await store.onModuleInit();
    const unsubscribe: () => void = facade.subscribe("telemetry.flushIntervalMs", (value: number): void => {
      received.push(value);
    });

    facade.subscribe("telemetry.staleAfterMs", otherKey);
    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 50, version: 1, updatedAt: UPDATED_AT });
    const afterApply: number = facade.get("telemetry.flushIntervalMs");

    store.applyOverride({ key: "telemetry.flushIntervalMs", value: null, version: 2, updatedAt: UPDATED_AT });
    const afterRemove: number = facade.get("telemetry.flushIntervalMs");

    unsubscribe();
    store.applyOverride({ key: "telemetry.flushIntervalMs", value: 70, version: 3, updatedAt: UPDATED_AT });

    expect([afterApply, afterRemove]).toEqual([50, 33]);
    expect(received).toEqual([50, 33]);
    expect(otherKey).not.toHaveBeenCalled();
  });

  it("keeps notifying the other subscribers when one throws", async () => {
    jest.spyOn(Logger.prototype, "error").mockImplementation((): void => undefined);
    const store: PlatformSettingsStore = buildStore();
    const second: jest.Mock = jest.fn();

    await store.onModuleInit();
    store.subscribe("commands.ratePerSecond", (): void => {
      throw new Error("boom");
    });
    store.subscribe("commands.ratePerSecond", second);

    store.applyOverride({ key: "commands.ratePerSecond", value: 2, version: 1, updatedAt: UPDATED_AT });

    expect(second).toHaveBeenCalledWith(2);
  });
});
