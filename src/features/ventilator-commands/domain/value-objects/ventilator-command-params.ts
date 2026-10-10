/*
 * Funcionalidad: Parámetros del comando del ventilador
 * Descripción: Modos aceptados (VCV, PCV, SIMV, PSV), campos numéricos del comando tipado, parámetros obligatorios por modo y la forma del comando validado que se codifica y publica al ventilador físico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type VentilatorCommandModeValue = "VCV" | "PCV" | "SIMV" | "PSV";

export const VCV_COMMAND_MODE: VentilatorCommandModeValue = "VCV";
export const PCV_COMMAND_MODE: VentilatorCommandModeValue = "PCV";
export const SIMV_COMMAND_MODE: VentilatorCommandModeValue = "SIMV";
export const PSV_COMMAND_MODE: VentilatorCommandModeValue = "PSV";

export const VENTILATOR_COMMAND_MODE_VALUES: readonly VentilatorCommandModeValue[] = [
  VCV_COMMAND_MODE,
  PCV_COMMAND_MODE,
  SIMV_COMMAND_MODE,
  PSV_COMMAND_MODE,
] as const;

export type VentilatorCommandNumericField =
  | "tidalVolume"
  | "respiratoryRate"
  | "peep"
  | "fio2"
  | "pressureLimit"
  | "inspiratoryTime"
  | "ieRatio"
  | "flowRate"
  | "sensitivity";

export const VENTILATOR_COMMAND_NUMERIC_FIELDS: readonly VentilatorCommandNumericField[] = [
  "tidalVolume",
  "respiratoryRate",
  "peep",
  "fio2",
  "pressureLimit",
  "inspiratoryTime",
  "ieRatio",
  "flowRate",
  "sensitivity",
] as const;

export interface VentilatorCommandParams {
  readonly mode: VentilatorCommandModeValue;
  readonly tidalVolume?: number;
  readonly respiratoryRate?: number;
  readonly peep?: number;
  readonly fio2?: number;
  readonly pressureLimit?: number;
  readonly inspiratoryTime?: number;
  readonly ieRatio?: number;
  readonly flowRate?: number;
  readonly sensitivity?: number;
}

export const REQUIRED_PARAMETERS_BY_MODE: Readonly<Record<VentilatorCommandModeValue, readonly VentilatorCommandNumericField[]>> = {
  VCV: ["tidalVolume", "respiratoryRate", "peep", "fio2"],
  PCV: ["pressureLimit", "respiratoryRate", "peep", "fio2", "inspiratoryTime"],
  SIMV: ["tidalVolume", "respiratoryRate", "peep", "fio2"],
  PSV: ["pressureLimit", "peep", "fio2"],
};

export function isVentilatorCommandMode(value: unknown): value is VentilatorCommandModeValue {
  return typeof value === "string" && VENTILATOR_COMMAND_MODE_VALUES.includes(value as VentilatorCommandModeValue);
}
