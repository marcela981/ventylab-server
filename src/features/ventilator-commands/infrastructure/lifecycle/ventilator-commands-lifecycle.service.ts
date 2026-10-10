/*
 * Funcionalidad: Ciclo de vida de los comandos del ventilador
 * Descripción: Al iniciar el módulo arranca el refresco periódico del control exclusivo y el seguimiento de acuses o de parámetros aplicados; al apagar detiene los temporizadores y resuelve como TIMEOUT los comandos todavía enviados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, type OnApplicationShutdown, type OnModuleInit } from "@nestjs/common";

import { CommandLifecycleService } from "@/features/ventilator-commands/application/services/command-lifecycle.service";
import { OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";

@Injectable()
export class VentilatorCommandsLifecycleService implements OnModuleInit, OnApplicationShutdown {
  public constructor(
    private readonly _operatorControl: OperatorControlService,
    private readonly _commandLifecycle: CommandLifecycleService,
  ) {}

  public onModuleInit(): void {
    this._operatorControl.start();
    this._commandLifecycle.start();
  }

  public async onApplicationShutdown(): Promise<void> {
    this._operatorControl.stop();
    this._commandLifecycle.stop();

    await this._commandLifecycle.flushPersistence();
  }
}
