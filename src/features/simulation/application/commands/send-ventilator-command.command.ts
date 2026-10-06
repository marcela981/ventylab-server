/*
 * Funcionalidad: Comando SendVentilatorCommandCommand
 * Descripción: Intención de enviar ajustes del ventilador, ya sea a la simulación sintética del usuario o al ventilador físico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";

export class SendVentilatorCommandCommand {
  public readonly userId: string;
  public readonly command: VentilatorCommand;

  public constructor({ userId, command }: { userId: string; command: VentilatorCommand }) {
    this.userId = userId;
    this.command = command;
  }
}
