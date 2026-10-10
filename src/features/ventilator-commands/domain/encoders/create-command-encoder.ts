/*
 * Funcionalidad: Fábrica de codificadores de comandos
 * Descripción: Devuelve el codificador configurado por VENTILATOR_COMMAND_ENCODING (json por defecto, hex opcional)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CommandEncoder, type CommandEncodingValue, HEX_COMMAND_ENCODING } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { HexCommandEncoder } from "@/features/ventilator-commands/domain/encoders/hex-command.encoder";
import { JsonCommandEncoder } from "@/features/ventilator-commands/domain/encoders/json-command.encoder";

export function createCommandEncoder(encoding: CommandEncodingValue): CommandEncoder {
  return encoding === HEX_COMMAND_ENCODING ? new HexCommandEncoder() : new JsonCommandEncoder();
}
