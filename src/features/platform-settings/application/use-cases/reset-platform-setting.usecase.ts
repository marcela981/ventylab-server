/*
 * Funcionalidad: Caso de uso ResetPlatformSetting
 * Descripción: Devuelve un ajuste de la plataforma a su valor por defecto: en una transacción bajo el bloqueo de la clave compara la versión (concurrencia optimista), borra la sobrescritura y registra SETTINGS_CHANGED en la auditoría con el valor anterior y el valor por defecto; tras confirmar actualiza la caché y notifica a los suscriptores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ResetPlatformSettingCommand } from "@/features/platform-settings/application/commands/reset-platform-setting.command";
import { DEFAULT_SETTING_VERSION, PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { PlatformSettingVersionConflictError } from "@/features/platform-settings/domain/platform-settings.errors";
import { PLATFORM_SETTINGS_AUDIT_TARGET, type PlatformSettingOverride, SETTINGS_CHANGED_AUDIT_ACTION } from "@/features/platform-settings/domain/registry/platform-setting-values";
import { getPlatformSettingDefinition, type PlatformSettingDefinition, platformSettingLockKey } from "@/features/platform-settings/domain/registry/platform-settings.registry";
import { type IPlatformSettingsRepository, PLATFORM_SETTINGS_REPOSITORY_TOKEN } from "@/features/platform-settings/domain/repositories/platform-settings.repository";

/**
 * @throws {PlatformSettingNotFoundError} If the key is not in the settings registry
 * @throws {PlatformSettingVersionConflictError} If the setting changed since the given version was read
 */
@Injectable()
export class ResetPlatformSettingUseCase {
  public constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY_TOKEN)
    private readonly _repository: IPlatformSettingsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    private readonly _store: PlatformSettingsStore,
  ) {}

  public async execute(command: ResetPlatformSettingCommand): Promise<void> {
    const definition: PlatformSettingDefinition = getPlatformSettingDefinition(command.key);

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._repository.acquireTransactionLock(platformSettingLockKey(definition.key), transaction);

      const current: PlatformSettingOverride | undefined = await this._repository.getByKey(definition.key, transaction);
      const currentVersion: number = current?.version ?? DEFAULT_SETTING_VERSION;

      if (currentVersion !== command.version) {
        throw new PlatformSettingVersionConflictError(definition.key, currentVersion);
      }

      if (current === undefined) {
        return;
      }

      await this._repository.delete(definition.key, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        SETTINGS_CHANGED_AUDIT_ACTION,
        PLATFORM_SETTINGS_AUDIT_TARGET,
        definition.key,
        { value: current.value, origin: "OVERRIDE", version: currentVersion },
        { value: this._store.getDefault(definition.key), origin: "DEFAULT", version: DEFAULT_SETTING_VERSION },
        transaction,
      );
    });

    this._store.removeOverride(definition.key);
  }
}
