/*
 * Funcionalidad: Comando del ventilador
 * Descripción: Define los modos de ventilación, la forma del comando que se envía al ventilador físico o a la simulación sintética y los rangos seguros de cada parámetro (contrato con Node-RED/ESP)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
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

export const VENTILATOR_SAFE_RANGES: VentilatorSafeRanges = {
  PEEP: { min: 0, max: 20, unit: "cmH₂O" },
  FIO2: { min: 0.21, max: 1.0, unit: "fraction" },
  TIDAL_VOLUME: { min: 200, max: 800, unit: "ml" },
  RESPIRATORY_RATE: { min: 5, max: 40, unit: "breaths/min" },
  PRESSURE_LIMIT: { min: 10, max: 50, unit: "cmH₂O" },
  INSPIRATORY_TIME: { min: 0.5, max: 3.0, unit: "seconds" },
  FLOW_RATE: { min: 20, max: 100, unit: "L/min" },
};
