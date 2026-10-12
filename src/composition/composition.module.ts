/*
 * Funcionalidad: Módulo de composición
 * Descripción: Raíz de composición global fuera de src/features: registra PlatformSettingsModule con sus valores por defecto (configuración y constantes de cada feature) y la disponibilidad de proveedores de IA, y enlaza los puertos de ajustes de las features consumidoras (AI_SETTINGS_PROVIDER_TOKEN, AI_PRICE_TABLE_TOKEN, RESERVATION_SETTINGS_TOKEN, VENTILATOR_TELEMETRY_SETTINGS_TOKEN, VENTILATOR_COMMANDS_SETTINGS_TOKEN, SIMULATION_SESSION_SETTINGS_TOKEN, EVALUATION_GRADING_CONFIG_TOKEN) a adaptadores sobre PlatformSettingsFacade, de modo que ninguna feature importa platform-settings
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module, type Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import {
  createAiProviderAvailability,
  createConfigAiSettingsProvider,
  PlatformAiPriceTableProvider,
  PlatformAiSettingsProvider,
} from "@/composition/adapters/ai-settings.adapters";
import {
  createEvaluationGradingConfig,
  createReservationSettings,
  createSimulationSessionSettings,
  createVentilatorCommandsSettings,
  createVentilatorTelemetrySettings,
} from "@/composition/adapters/feature-settings.adapters";
import { readPlatformSettingDefaults } from "@/composition/platform-setting-defaults";
import { AI_SETTINGS_PROVIDER_TOKEN, type IAiSettingsProvider } from "@/features/ai/application/ports/ai-settings-provider.interface";
import { AI_PRICE_TABLE_TOKEN, type IAiPriceTableProvider } from "@/features/ai-telemetry/application/ports/ai-price-table.interface";
import { EVALUATION_GRADING_CONFIG_TOKEN, type EvaluationGradingConfig } from "@/features/evaluation/application/evaluation-grading.config";
import { AI_PROVIDER_AVAILABILITY_TOKEN } from "@/features/platform-settings/application/ports/ai-provider-availability.interface";
import { PLATFORM_SETTING_DEFAULTS_TOKEN } from "@/features/platform-settings/application/ports/platform-setting-defaults.interface";
import { PlatformSettingsFacade } from "@/features/platform-settings/application/services/platform-settings.facade";
import { PlatformSettingsModule } from "@/features/platform-settings/platform-settings.module";
import { RESERVATION_SETTINGS_TOKEN, type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { readReservationSettings } from "@/features/reservations/infrastructure/config/reservation-settings.config";
import { SIMULATION_SESSION_SETTINGS_TOKEN, type SimulationSessionSettings } from "@/features/simulation/application/tokens/simulation-session-settings.token";
import { readSimulationSessionSettings } from "@/features/simulation/infrastructure/config/simulation-session-config";
import {
  VENTILATOR_COMMANDS_SETTINGS_TOKEN,
  type VentilatorCommandsSettings,
} from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { readVentilatorCommandsSettings } from "@/features/ventilator-commands/infrastructure/config/ventilator-commands-config";
import {
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  type VentilatorTelemetrySettings,
} from "@/features/ventilator-telemetry/application/tokens/ventilator-telemetry-settings.token";
import { readVentilatorTelemetrySettings } from "@/features/ventilator-telemetry/infrastructure/config/ventilator-telemetry-config";

type Config = ConfigService<EnvironmentVariables, true>;

export const SETTINGS_PORT_PROVIDERS: Provider[] = [
  {
    provide: AI_SETTINGS_PROVIDER_TOKEN,
    inject: [PlatformSettingsFacade, ConfigService],
    useFactory: (settings: PlatformSettingsFacade, configService: Config): IAiSettingsProvider =>
      new PlatformAiSettingsProvider(settings, createConfigAiSettingsProvider(configService)),
  },
  {
    provide: AI_PRICE_TABLE_TOKEN,
    inject: [PlatformSettingsFacade],
    useFactory: (settings: PlatformSettingsFacade): IAiPriceTableProvider => new PlatformAiPriceTableProvider(settings),
  },
  {
    provide: RESERVATION_SETTINGS_TOKEN,
    inject: [PlatformSettingsFacade, ConfigService],
    useFactory: (settings: PlatformSettingsFacade, configService: Config): ReservationSettings => createReservationSettings(settings, readReservationSettings(configService)),
  },
  {
    provide: VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
    inject: [PlatformSettingsFacade, ConfigService],
    useFactory: (settings: PlatformSettingsFacade, configService: Config): VentilatorTelemetrySettings =>
      createVentilatorTelemetrySettings(settings, readVentilatorTelemetrySettings(configService)),
  },
  {
    provide: VENTILATOR_COMMANDS_SETTINGS_TOKEN,
    inject: [PlatformSettingsFacade, ConfigService],
    useFactory: (settings: PlatformSettingsFacade, configService: Config): VentilatorCommandsSettings =>
      createVentilatorCommandsSettings(settings, readVentilatorCommandsSettings(configService)),
  },
  {
    provide: SIMULATION_SESSION_SETTINGS_TOKEN,
    inject: [PlatformSettingsFacade, ConfigService],
    useFactory: (settings: PlatformSettingsFacade, configService: Config): SimulationSessionSettings =>
      createSimulationSessionSettings(settings, readSimulationSessionSettings(configService)),
  },
  {
    provide: EVALUATION_GRADING_CONFIG_TOKEN,
    inject: [PlatformSettingsFacade],
    useFactory: (settings: PlatformSettingsFacade): EvaluationGradingConfig => createEvaluationGradingConfig(settings),
  },
];

export const SETTINGS_PORT_TOKENS: symbol[] = [
  AI_SETTINGS_PROVIDER_TOKEN,
  AI_PRICE_TABLE_TOKEN,
  RESERVATION_SETTINGS_TOKEN,
  VENTILATOR_TELEMETRY_SETTINGS_TOKEN,
  VENTILATOR_COMMANDS_SETTINGS_TOKEN,
  SIMULATION_SESSION_SETTINGS_TOKEN,
  EVALUATION_GRADING_CONFIG_TOKEN,
];

@Global()
@Module({
  imports: [
    PlatformSettingsModule.register({
      defaultsProvider: { provide: PLATFORM_SETTING_DEFAULTS_TOKEN, inject: [ConfigService], useFactory: readPlatformSettingDefaults },
      aiProviderAvailabilityProvider: { provide: AI_PROVIDER_AVAILABILITY_TOKEN, inject: [ConfigService], useFactory: createAiProviderAvailability },
    }),
  ],
  providers: SETTINGS_PORT_PROVIDERS,
  exports: SETTINGS_PORT_TOKENS,
})
export class CompositionModule {}
