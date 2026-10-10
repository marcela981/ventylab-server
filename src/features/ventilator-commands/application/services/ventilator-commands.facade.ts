/*
 * Funcionalidad: Fachada pública de los comandos del ventilador
 * Descripción: API que VentilatorCommandsModule exporta para otras features (adaptador heredado de simulación): enviar un comando al ventilador físico por el único camino validado y autorizado, y leer en memoria el estado del control exclusivo y la última reserva activa observada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { SendVentilatorCommandCommand } from "@/features/ventilator-commands/application/commands/ventilator-commands.commands";
import { type SentVentilatorCommandResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { type OperatorControlSnapshot, OperatorControlService } from "@/features/ventilator-commands/application/services/operator-control.service";
import { SendVentilatorCommandUseCase } from "@/features/ventilator-commands/application/use-cases/send-ventilator-command.usecase";

export interface VentilatorCommandSendInput {
  readonly userId: string;
  readonly role: string;
  readonly params: unknown;
}

export interface VentilatorControlOverview {
  readonly activeReservation: ActiveReservationSummary | undefined;
  readonly operator: OperatorControlSnapshot | undefined;
}

@Injectable()
export class VentilatorCommandsFacade {
  public constructor(
    private readonly _sendVentilatorCommandUseCase: SendVentilatorCommandUseCase,
    private readonly _operatorControl: OperatorControlService,
  ) {}

  public async send(input: VentilatorCommandSendInput): Promise<SentVentilatorCommandResult> {
    return await this._sendVentilatorCommandUseCase.execute(new SendVentilatorCommandCommand({ userId: input.userId, role: input.role, params: input.params }));
  }

  public getControlOverview(): VentilatorControlOverview {
    return { activeReservation: this._operatorControl.activeReservation, operator: this._operatorControl.state };
  }
}
