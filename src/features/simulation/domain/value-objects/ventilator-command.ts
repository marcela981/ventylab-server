/*
 * Funcionalidad: Comando del ventilador
 * Descripción: Define los modos de ventilación, la forma del comando que se envía al ventilador físico o a la simulación sintética y los rangos seguros de cada parámetro (contrato con Node-RED/ESP), derivados de la fuente única común de límites del ventilador
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_PARAMETER_LIMITS, type VentilatorParameterLimit } from "@/common/domain/ventilator/ventilator-limits";

export type VentilationModeValue = "VCV" | "PCV" | "SIMV" | "PSV";

export const VCV_MODE_VALUE: VentilationModeValue = "VCV";
export const PCV_MODE_VALUE: VentilationModeValue = "PCV";
export const SIMV_MODE_VALUE: VentilationModeValue = "SIMV";
export const PSV_MODE_VALUE: VentilationModeValue = "PSV";

export const VENTILATION_MODE_VALUES: readonly VentilationModeValue[] = [
  VCV_MODE_VALUE,
  PCV_MODE_VALUE,
  SIMV_MODE_VALUE,
  PSV_MODE_VALUE,
] as const;

export interface VentilatorCommand {
  mode: VentilationModeValue;
  tidalVolume: number;
  respiratoryRate: number;
  peep: number;
  fio2: number;
  pressureLimit?: number;
  inspiratoryTime?: number;
  ieRatio?: string;
  sensitivity?: number;
  flowRate?: number;
  timestamp?: number;
}

export interface VentilatorSafeRange {
  readonly min: number;
  readonly max: number;
  readonly unit: string;
}

export interface VentilatorSafeRanges {
  readonly PEEP: VentilatorSafeRange;
  readonly FIO2: VentilatorSafeRange;
  readonly TIDAL_VOLUME: VentilatorSafeRange;
  readonly RESPIRATORY_RATE: VentilatorSafeRange;
  readonly PRESSURE_LIMIT: VentilatorSafeRange;
  readonly INSPIRATORY_TIME: VentilatorSafeRange;
  readonly FLOW_RATE: VentilatorSafeRange;
}

function withUnit(limit: VentilatorParameterLimit, unit: string): VentilatorSafeRange {
  return { min: limit.min, max: limit.max, unit };
}

export const VENTILATOR_SAFE_RANGES: VentilatorSafeRanges = {
  PEEP: withUnit(VENTILATOR_PARAMETER_LIMITS.peepCmH2O, "cmH₂O"),
  FIO2: withUnit(VENTILATOR_PARAMETER_LIMITS.fio2, "fraction"),
  TIDAL_VOLUME: withUnit(VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl, "ml"),
  RESPIRATORY_RATE: withUnit(VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm, "breaths/min"),
  PRESSURE_LIMIT: withUnit(VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O, "cmH₂O"),
  INSPIRATORY_TIME: withUnit(VENTILATOR_PARAMETER_LIMITS.inspiratoryTimeS, "seconds"),
  FLOW_RATE: withUnit(VENTILATOR_PARAMETER_LIMITS.flowRateLpm, "L/min"),
};
