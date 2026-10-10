/*
 * Funcionalidad: Contrato de los codificadores de comandos
 * Descripción: Estrategia que convierte un comando validado y su identificador de correlación en la carga publicada por MQTT y en una representación legible que se guarda en el historial; nombres de las codificaciones disponibles (json, hex)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

export type CommandEncodingValue = "json" | "hex";

export const JSON_COMMAND_ENCODING: CommandEncodingValue = "json";
export const HEX_COMMAND_ENCODING: CommandEncodingValue = "hex";

export const COMMAND_ENCODING_VALUES: readonly CommandEncodingValue[] = [JSON_COMMAND_ENCODING, HEX_COMMAND_ENCODING] as const;

export interface EncodedCommand {
  readonly payload: string | Buffer;
  readonly printable: string;
}

export interface CommandEncoder {
  readonly encoding: CommandEncodingValue;
  encode(command: VentilatorCommandParams, correlationId: string): EncodedCommand;
}
