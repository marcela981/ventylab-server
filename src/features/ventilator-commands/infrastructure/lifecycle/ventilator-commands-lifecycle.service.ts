/*
 * Funcionalidad: Ciclo de vida de los comandos del ventilador
 * Descripción: Al iniciar el módulo arranca el refresco periódico del control exclusivo y el seguimiento de acuses o de parámetros aplicados; al destruirse el módulo (antes de que el módulo global de base de datos desconecte Prisma) detiene los temporizadores, resuelve como TIMEOUT los comandos todavía enviados (TIMEOUT server_shutdown_unconfirmed los que aún esperaban la confirmación del broker) y espera hasta COMMANDS_SHUTDOWN_FLUSH_TIMEOUT_MS la persistencia pendiente
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";

import { CommandLifecycleService } from "@/features/ventilator-commands/application/services/command-lifecycle.service";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";

export const COMMANDS_SHUTDOWN_FLUSH_TIMEOUT_MS: number = 2000;

@Injectable()
export class VentilatorCommandsLifecycleService implements OnModuleInit, OnModuleDestroy {
  public constructor(
    private readonly _operatorControl: OperatorControlService,
    private readonly _commandLifecycle: CommandLifecycleService,
  ) {}

  public onModuleInit(): void {
    this._operatorControl.start();
    this._commandLifecycle.start();
  }

  // Nest destroys feature modules before the global database module, so pending writes still reach Prisma here
  public async onModuleDestroy(): Promise<void> {
    this._operatorControl.stop();
    this._commandLifecycle.stop();

    await this._commandLifecycle.flushPersistence(COMMANDS_SHUTDOWN_FLUSH_TIMEOUT_MS);
  }
}
