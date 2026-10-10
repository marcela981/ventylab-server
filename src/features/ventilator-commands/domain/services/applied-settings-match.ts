/*
 * Funcionalidad: Coincidencia de parámetros aplicados
 * Descripción: Decide si los parámetros que informa una trama de telemetría coinciden con los del comando dentro de la tolerancia relativa configurada; exige que la trama informe cada parámetro numérico del comando con el mismo nombre y, si informa el modo, que sea el mismo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_COMMAND_NUMERIC_FIELDS, type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

export function settingsMatchCommand(
  command: VentilatorCommandParams,
  settings: Readonly<Record<string, number>>,
  reportedMode: string | undefined,
  toleranceRatio: number,
): boolean {
  if (reportedMode !== undefined && reportedMode.toUpperCase() !== command.mode) {
    return false;
  }

  let compared: number = 0;

  for (const field of VENTILATOR_COMMAND_NUMERIC_FIELDS) {
    const expected: number | undefined = command[field];

    if (expected === undefined) {
      continue;
    }

    const actual: number | undefined = settings[field];

    if (actual === undefined || !Number.isFinite(actual)) {
      return false;
    }

    if (Math.abs(actual - expected) > toleranceRatio * Math.max(Math.abs(expected), Number.EPSILON)) {
      return false;
    }

    compared += 1;
  }

  return compared > 0;
}
