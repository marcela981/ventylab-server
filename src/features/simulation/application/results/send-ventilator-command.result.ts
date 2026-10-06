/*
 * Funcionalidad: Resultado SendVentilatorCommandResult
 * Descripción: Identificador del comando aceptado y el destino que lo recibió (ajuste de la simulación sintética en curso, arranque de la simulación sintética o ventilador físico)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CommandTargetValue = "synthetic_update" | "synthetic_start" | "physical";

export const SYNTHETIC_UPDATE_TARGET: CommandTargetValue = "synthetic_update";
export const SYNTHETIC_START_TARGET: CommandTargetValue = "synthetic_start";
export const PHYSICAL_TARGET: CommandTargetValue = "physical";

export class SendVentilatorCommandResult {
  public readonly commandId: string;
  public readonly target: CommandTargetValue;
  public readonly timestamp: number;

  public constructor({ commandId, target, timestamp }: { commandId: string; target: CommandTargetValue; timestamp: number }) {
    this.commandId = commandId;
    this.target = target;
    this.timestamp = timestamp;
  }
}
