/*
 * Funcionalidad: Módulo VentilatorCommandsModule
 * Descripción: Registra el control exclusivo del operador, la validación, el limitador de frecuencia, el codificador configurable, el ciclo de vida con acuses o parámetros aplicados, la persistencia en ventilator_commands y los endpoints /api/ventilator; exporta VentilatorCommandsFacade y depende solo de las fachadas de reservas y de telemetría del ventilador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ReservationsModule } from "@/features/reservations/reservations.module";
import { CommandLifecycleService } from "@/features/ventilator-commands/application/services/command-lifecycle.service";
import { CommandRateLimiterService } from "@/features/ventilator-commands/application/services/command-rate-limiter.service";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";
import { VentilatorCommandsFacade } from "@/features/ventilator-commands/application/services/ventilator-commands.facade";
import {
  VENTILATOR_COMMAND_ENCODER_TOKEN,
  VENTILATOR_COMMANDS_SETTINGS_TOKEN,
  type VentilatorCommandsSettings,
} from "@/features/ventilator-commands/application/tokens/ventilator-commands-settings.token";
import { GetVentilatorCommandsUseCase } from "@/features/ventilator-commands/application/use-cases/get-ventilator-commands.usecase";
import { SendVentilatorCommandUseCase } from "@/features/ventilator-commands/application/use-cases/send-ventilator-command.usecase";
import {
  GetVentilatorControlUseCase,
  ReleaseVentilatorControlUseCase,
  TakeVentilatorControlUseCase,
  VentilatorControlHeartbeatUseCase,
} from "@/features/ventilator-commands/application/use-cases/ventilator-control.usecases";
import { type CommandEncoder } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { createCommandEncoder } from "@/features/ventilator-commands/domain/encoders/create-command-encoder";
import { VENTILATOR_COMMANDS_REPOSITORY_TOKEN } from "@/features/ventilator-commands/domain/repositories/ventilator-commands.repository";
import { readVentilatorCommandsSettings } from "@/features/ventilator-commands/infrastructure/config/ventilator-commands-config";
import { VentilatorCommandsEventsHandlers } from "@/features/ventilator-commands/infrastructure/events/ventilator-commands-events.handlers";
import { VentilatorCommandsLifecycleService } from "@/features/ventilator-commands/infrastructure/lifecycle/ventilator-commands-lifecycle.service";
import { VentilatorCommandsPrismaRepository } from "@/features/ventilator-commands/infrastructure/persistence/prisma/repositories/ventilator-commands-prisma.repository";
import { VentilatorCommandsController } from "@/features/ventilator-commands/presentation/controllers/ventilator-commands.controller";
import { VentilatorTelemetryModule } from "@/features/ventilator-telemetry/ventilator-telemetry.module";

function createEncoder(settings: VentilatorCommandsSettings): CommandEncoder {
  return createCommandEncoder(settings.encoding);
}

@Module({
  imports: [ReservationsModule, VentilatorTelemetryModule],
  controllers: [VentilatorCommandsController],
  providers: [
    { provide: VENTILATOR_COMMANDS_SETTINGS_TOKEN, useFactory: readVentilatorCommandsSettings, inject: [ConfigService] },
    { provide: VENTILATOR_COMMAND_ENCODER_TOKEN, useFactory: createEncoder, inject: [VENTILATOR_COMMANDS_SETTINGS_TOKEN] },
    { provide: VENTILATOR_COMMANDS_REPOSITORY_TOKEN, useClass: VentilatorCommandsPrismaRepository },
    OperatorControlService,
    CommandRateLimiterService,
    CommandLifecycleService,
    SendVentilatorCommandUseCase,
    GetVentilatorControlUseCase,
    TakeVentilatorControlUseCase,
    ReleaseVentilatorControlUseCase,
    VentilatorControlHeartbeatUseCase,
    GetVentilatorCommandsUseCase,
    VentilatorCommandsEventsHandlers,
    VentilatorCommandsLifecycleService,
    VentilatorCommandsFacade,
  ],
  exports: [VentilatorCommandsFacade],
})
export class VentilatorCommandsModule {}
