/*
 * Funcionalidad: Ajustes de los comandos del ventilador
 * Descripción: Ajustes resueltos desde la configuración (tópicos de comando y de acuse con el prefijo de pruebas aplicado en NODE_ENV=test, codificación, tiempo máximo de espera, frecuencia por usuario, gracia de presencia del operador, refresco del control, tolerancia de parámetros aplicados y límites de seguridad recortados) y los tokens de los ajustes y del codificador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CommandEncodingValue } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { type VentilatorCommandSafetyLimits } from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";

export const VENTILATOR_COMMANDS_SETTINGS_TOKEN: unique symbol = Symbol("VENTILATOR_COMMANDS_SETTINGS_TOKEN");

export const VENTILATOR_COMMAND_ENCODER_TOKEN: unique symbol = Symbol("VENTILATOR_COMMAND_ENCODER_TOKEN");

export interface VentilatorCommandsSettings {
  readonly commandTopic: string;
  readonly ackTopic: string | undefined;
  readonly encoding: CommandEncodingValue;
  readonly timeoutMs: number;
  readonly ratePerSecond: number;
  readonly operatorGraceMs: number;
  readonly controlRefreshMs: number;
  readonly applyToleranceRatio: number;
  readonly safety: VentilatorCommandSafetyLimits;
}
