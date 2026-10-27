/*
 * Funcionalidad: Módulo VentilatorCommandsModule
 * Descripción: Registra el control exclusivo del operador, la validación, el limitador de frecuencia, el codificador configurable, el ciclo de vida con acuses o parámetros aplicados, la persistencia en ventilator_commands y los endpoints /api/ventilator (los ajustes VENTILATOR_COMMANDS_SETTINGS_TOKEN los enlaza la raíz de composición); exporta VentilatorCommandsFacade y depende de las fachadas de reservas, de usuarios (nombre del operador) y de telemetría del ventilador
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { ReservationsModule } from "@/features/reservations/reservations.module";
import { UsersModule } from "@/features/users/users.module";
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
import { VentilatorCommandsEventsHandlers } from "@/features/ventilator-commands/infrastructure/events/ventilator-commands-events.handlers";
import { VentilatorCommandsLifecycleService } from "@/features/ventilator-commands/infrastructure/lifecycle/ventilator-commands-lifecycle.service";
import { VentilatorCommandsPrismaRepository } from "@/features/ventilator-commands/infrastructure/persistence/prisma/repositories/ventilator-commands-prisma.repository";
import { VentilatorCommandsController } from "@/features/ventilator-commands/presentation/controllers/ventilator-commands.controller";
import { VentilatorTelemetryModule } from "@/features/ventilator-telemetry/ventilator-telemetry.module";

function createEncoder(settings: VentilatorCommandsSettings): CommandEncoder {
  return createCommandEncoder(settings.encoding);
}

@Module({
  imports: [ReservationsModule, UsersModule, VentilatorTelemetryModule],
  controllers: [VentilatorCommandsController],
  providers: [
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
