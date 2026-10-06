/*
 * Funcionalidad: Comando StartPatientSimulationCommand
 * Descripción: Intención de iniciar el ciclo de señales del paciente simulado con los ajustes iniciales del ventilador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";

export class StartPatientSimulationCommand {
  public readonly userId: string;
  public readonly command: VentilatorCommand;

  public constructor({ userId, command }: { userId: string; command: VentilatorCommand }) {
    this.userId = userId;
    this.command = command;
  }
}
