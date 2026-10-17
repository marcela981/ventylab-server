/*
 * Funcionalidad: Caso de uso UpdatePlatformSetting
 * Descripción: Valida el nuevo valor contra el registro y sus límites duros, exige credenciales a los proveedores de IA que entran en una cadena (con el detalle por campo de la clave), y en una transacción bajo el bloqueo de la clave compara la versión (concurrencia optimista), guarda la sobrescritura con la versión siguiente (también tras una marca de restablecimiento o una sobrescritura que ya no es válida) y registra SETTINGS_CHANGED en la auditoría con el valor anterior y el nuevo; tras confirmar actualiza la caché y notifica a los suscriptores
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { UpdatePlatformSettingCommand } from "@/features/platform-settings/application/commands/update-platform-setting.command";
import { AI_PROVIDER_AVAILABILITY_TOKEN, type IAiProviderAvailability } from "@/features/platform-settings/application/ports/ai-provider-availability.interface";
import { DEFAULT_SETTING_VERSION, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { AiProviderNotConfiguredError, PlatformSettingVersionConflictError } from "@/features/platform-settings/domain/platform-settings.errors";
import {
  type AiUseCaseSettingValue,
  isResetPlatformSetting,
  PLATFORM_SETTINGS_AUDIT_TARGET,
  type PlatformSettingOverride,
  SETTINGS_CHANGED_AUDIT_ACTION,
} from "@/features/platform-settings/domain/registry/platform-setting-values";
import {
  getPlatformSettingDefinition,
  isAiUseCaseSettingKey,
  type PlatformSettingDefinition,
  platformSettingLockKey,
} from "@/features/platform-settings/domain/registry/platform-settings.registry";
import { type IPlatformSettingsRepository, PLATFORM_SETTINGS_REPOSITORY_TOKEN } from "@/features/platform-settings/domain/repositories/platform-settings.repository";
import { providersEnteringChain } from "@/features/platform-settings/domain/services/ai-provider-chain";

/**
 * @throws {PlatformSettingNotFoundError} If the key is not in the settings registry
 * @throws {InvalidPlatformSettingValueError} If the value has the wrong type or shape
 * @throws {PlatformSettingHardLimitExceededError} If the value is outside the hard limits of the setting
 * @throws {AiProviderNotConfiguredError} If an AI provider without credentials enters a provider chain
 * @throws {PlatformSettingVersionConflictError} If the setting changed since the given version was read
 */
@Injectable()
export class UpdatePlatformSettingUseCase {
  public constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY_TOKEN)
    private readonly _repository: IPlatformSettingsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    @Inject(AI_PROVIDER_AVAILABILITY_TOKEN)
    private readonly _aiProviders: IAiProviderAvailability,
    private readonly _store: PlatformSettingsStore,
  ) {}

  public async execute(command: UpdatePlatformSettingCommand): Promise<void> {
    const definition: PlatformSettingDefinition = getPlatformSettingDefinition(command.key);
    const value: unknown = definition.parse(command.value);

    const saved: PlatformSettingOverride = await this._transactionManager.run(async (transaction: unknown): Promise<PlatformSettingOverride> => {
      await this._repository.acquireTransactionLock(platformSettingLockKey(definition.key), transaction);

      const current: PlatformSettingOverride | undefined = await this._repository.getByKey(definition.key, transaction);
      const currentVersion: number = current?.version ?? DEFAULT_SETTING_VERSION;

      if (currentVersion !== command.version) {
        throw new PlatformSettingVersionConflictError(definition.key, currentVersion);
      }

      const effective: PlatformSettingOverride | undefined = current === undefined || isResetPlatformSetting(current) ? undefined : current;
      const before: unknown = effective === undefined ? this._store.getDefault(definition.key) : effective.value;

      this._assertProvidersConfigured(definition, effective, value);

      const override: PlatformSettingOverride = await this._repository.save(
        { key: definition.key, value, version: currentVersion + 1, updatedById: command.performedBy },
        transaction,
      );

      await this._auditRecorder.record(
        command.performedBy,
        SETTINGS_CHANGED_AUDIT_ACTION,
        PLATFORM_SETTINGS_AUDIT_TARGET,
        definition.key,
        { value: before, origin: effective === undefined ? "DEFAULT" : "OVERRIDE", version: currentVersion },
        { value, origin: "OVERRIDE", version: override.version },
        transaction,
      );

      return override;
    });

    this._store.applyOverride(saved);
  }

  private _assertProvidersConfigured(definition: PlatformSettingDefinition, current: PlatformSettingOverride | undefined, after: unknown): void {
    if (!isAiUseCaseSettingKey(definition.key)) {
      return;
    }

    const missing: string[] = providersEnteringChain(this._effectiveValue(definition, current) as AiUseCaseSettingValue, after as AiUseCaseSettingValue).filter(
      (provider: string): boolean => !this._aiProviders.isConfigured(provider),
    );

    if (missing.length > 0) {
      throw new AiProviderNotConfiguredError(missing, definition.key);
    }
  }

  private _effectiveValue(definition: PlatformSettingDefinition, current: PlatformSettingOverride | undefined): unknown {
    if (current === undefined) {
      return this._store.getDefault(definition.key);
    }

    try {
      return definition.parse(current.value);
    } catch {
      return this._store.getDefault(definition.key);
    }
  }
}
