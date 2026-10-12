/*
 * Funcionalidad: Módulo PlatformSettingsModule
 * Descripción: Registra el repositorio Prisma de sobrescrituras, la caché en memoria, los casos de uso y el controlador de administración de ajustes; exporta PlatformSettingsFacade. Se registra con register(), que recibe de la raíz de composición los proveedores de los valores por defecto (PLATFORM_SETTING_DEFAULTS_TOKEN) y de la disponibilidad de proveedores de IA (AI_PROVIDER_AVAILABILITY_TOKEN)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DynamicModule, Module, type Provider } from "@nestjs/common";

import { PlatformSettingsFacade } from "@/features/platform-settings/application/services/platform-settings.facade";
import { PlatformSettingsStore } from "@/features/platform-settings/application/services/platform-settings.store";
import { GetPlatformSettingsUseCase } from "@/features/platform-settings/application/use-cases/get-platform-settings.usecase";
import { ResetPlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/reset-platform-setting.usecase";
import { UpdatePlatformSettingUseCase } from "@/features/platform-settings/application/use-cases/update-platform-setting.usecase";
import { PLATFORM_SETTINGS_REPOSITORY_TOKEN } from "@/features/platform-settings/domain/repositories/platform-settings.repository";
import { PlatformSettingsPrismaRepository } from "@/features/platform-settings/infrastructure/persistence/prisma/repositories/platform-settings-prisma.repository";
import { PlatformSettingsController } from "@/features/platform-settings/presentation/controllers/platform-settings.controller";

export interface PlatformSettingsModuleOptions {
  readonly defaultsProvider: Provider;
  readonly aiProviderAvailabilityProvider: Provider;
}

@Module({})
export class PlatformSettingsModule {
  public static register(options: PlatformSettingsModuleOptions): DynamicModule {
    return {
      module: PlatformSettingsModule,
      controllers: [PlatformSettingsController],
      providers: [
        options.defaultsProvider,
        options.aiProviderAvailabilityProvider,
        { provide: PLATFORM_SETTINGS_REPOSITORY_TOKEN, useClass: PlatformSettingsPrismaRepository },
        PlatformSettingsStore,
        GetPlatformSettingsUseCase,
        UpdatePlatformSettingUseCase,
        ResetPlatformSettingUseCase,
        PlatformSettingsFacade,
      ],
      exports: [PlatformSettingsFacade],
    };
  }
}
