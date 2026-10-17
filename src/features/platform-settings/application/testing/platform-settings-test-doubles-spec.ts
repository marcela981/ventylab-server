/*
 * Funcionalidad: Dobles de prueba de ajustes de la plataforma
 * Descripción: Valores por defecto completos de prueba, repositorio en memoria de sobrescrituras (con fallo de carga opcional), gestor de transacciones que deshace los cambios si el trabajo falla, registrador de auditoría en memoria y disponibilidad de proveedores de IA configurable
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { AI_USE_CASE_VALUES, type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";
import { type IAiProviderAvailability } from "@/features/platform-settings/application/ports/ai-provider-availability.interface";
import { type PlatformSettingDefaults } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import {
  type AiUseCaseSettingKey,
  type AiUseCaseSettingValue,
  type PlatformSettingOverride,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import { type IPlatformSettingsRepository, type SavePlatformSettingOverride } from "@/features/platform-settings/domain/repositories/platform-settings.repository";

export const TEST_AI_USE_CASE: AiUseCaseSettingValue = {
  providerChain: ["gemini"],
  models: { gemini: "gemini-2.5-flash", openai: "gpt-4o-mini" },
  timeoutMs: 30_000,
  maxOutputTokens: 1024,
  temperature: 0.4,
};

export function buildTestDefaults(): PlatformSettingDefaults {
  const aiUseCases: Record<AiUseCaseSettingKey, AiUseCaseSettingValue> = Object.fromEntries(
    AI_USE_CASE_VALUES.map((useCase: AiUseCaseValue): [string, AiUseCaseSettingValue] => [`ai.useCase.${useCase}`, TEST_AI_USE_CASE]),
  ) as Record<AiUseCaseSettingKey, AiUseCaseSettingValue>;

  return {
    ...aiUseCases,
    "ai.quotas": { STUDENT: { "*": { requestsPerDay: 100, tokensPerDay: 200_000 } } },
    "ai.prices": { gemini: { "gemini-2.5-flash": { inputPer1kUsd: 0.0003, outputPer1kUsd: 0.0025 } } },
    "ai.tutor.topicCheck.enabled": true,
    "evaluation.passingGrade": 3,
    "evaluation.submitGraceSeconds": 30,
    "analytics.risk.maxFailedEvaluations": 0,
    "analytics.risk.minProgressPct": 0,
    "analytics.risk.inactivityDays": 0,
    "simulation.rubric.defaultThresholds": { targetsReached: 1, timeToStabilizeSeconds: 300, timeInRangePercent: 80, safetyToleranceSeconds: 0 },
    "simulation.allowedTimeMultipliers": [1, 2, 4],
    "simulation.abandonAfterMinutes": 30,
    "reservations.maxDurationMinutes": 120,
    "reservations.slotMinutes": 15,
    "reservations.maxAdvanceDays": 14,
    "reservations.maxUpcomingPerStudent": 3,
    "reservations.maxUpcomingPerGroup": 5,
    "telemetry.flushIntervalMs": 33,
    "telemetry.staleAfterMs": 2000,
    "telemetry.recordingHz": 20,
    "telemetry.recordingFlushSeconds": 5,
    "commands.ratePerSecond": 5,
    "commands.ackTimeoutMs": 3000,
    "commands.safety.maxPeep": 15,
    "commands.safety.maxPressureLimit": 40,
    "commands.safety.maxTidalVolume": 700,
    "commands.safety.maxRespiratoryRate": 35,
    "commands.safety.maxIeRatio": 1,
  };
}

export class InMemoryPlatformSettingsRepository implements IPlatformSettingsRepository {
  public readonly rows: Map<string, PlatformSettingOverride> = new Map<string, PlatformSettingOverride>();
  public readonly locks: string[] = [];
  public loadError: Error | undefined;

  public getAll(): Promise<PlatformSettingOverride[]> {
    if (this.loadError !== undefined) {
      return Promise.reject(this.loadError);
    }

    return Promise.resolve([...this.rows.values()]);
  }

  public getByKey(key: string): Promise<PlatformSettingOverride | undefined> {
    return Promise.resolve(this.rows.get(key));
  }

  public save(override: SavePlatformSettingOverride): Promise<PlatformSettingOverride> {
    const row: PlatformSettingOverride = { ...override, updatedAt: new Date("2026-10-11T12:00:00.000Z") };

    this.rows.set(override.key, row);

    return Promise.resolve(row);
  }

  public acquireTransactionLock(key: string): Promise<void> {
    this.locks.push(key);

    return Promise.resolve();
  }
}

export class RollbackTransactionManager implements ITransactionManager {
  public constructor(private readonly _repository: InMemoryPlatformSettingsRepository) {}

  public async run<T>(work: (transaction: unknown) => Promise<T>): Promise<T> {
    const snapshot: Map<string, PlatformSettingOverride> = new Map<string, PlatformSettingOverride>(this._repository.rows);

    try {
      return await work("tx");
    } catch (error: unknown) {
      this._repository.rows.clear();
      snapshot.forEach((row: PlatformSettingOverride, key: string): void => {
        this._repository.rows.set(key, row);
      });

      throw error;
    }
  }
}

export interface RecordedAudit {
  readonly actorId: string | undefined;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly before: Record<string, unknown>;
  readonly after: Record<string, unknown>;
  readonly transaction: unknown;
}

export class InMemoryAuditRecorder implements IAuditRecorder {
  public readonly entries: RecordedAudit[] = [];

  public record(
    actorId: string | undefined,
    action: string,
    targetType: string,
    targetId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    transaction?: unknown,
  ): Promise<void> {
    this.entries.push({ actorId, action, targetType, targetId, before, after, transaction });

    return Promise.resolve();
  }
}

export class StaticAiProviderAvailability implements IAiProviderAvailability {
  public constructor(private readonly _configured: readonly string[]) {}

  public isConfigured(providerId: string): boolean {
    return this._configured.includes(providerId);
  }
}
