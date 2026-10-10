/*
 * Funcionalidad: Límites de seguridad de los comandos del ventilador
 * Descripción: Límites más estrictos que los rangos compartidos para el ventilador físico (PEEP, presión límite, volumen corriente, frecuencia y relación I:E máximos), sus valores por defecto y el recorte que impide que la configuración los haga más laxos que los límites compartidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";

export interface VentilatorCommandSafetyLimits {
  readonly maxPeep: number;
  readonly maxPressureLimit: number;
  readonly maxTidalVolume: number;
  readonly maxRespiratoryRate: number;
  readonly maxIeRatio: number;
}

export const DEFAULT_VENTILATOR_SAFETY_LIMITS: VentilatorCommandSafetyLimits = {
  maxPeep: 15,
  maxPressureLimit: 40,
  maxTidalVolume: 700,
  maxRespiratoryRate: 35,
  maxIeRatio: 1,
};

export function clampSafetyLimits(requested: VentilatorCommandSafetyLimits): VentilatorCommandSafetyLimits {
  return {
    maxPeep: Math.min(requested.maxPeep, VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max),
    maxPressureLimit: Math.min(requested.maxPressureLimit, VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O.max),
    maxTidalVolume: Math.min(requested.maxTidalVolume, VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.max),
    maxRespiratoryRate: Math.min(requested.maxRespiratoryRate, VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm.max),
    maxIeRatio: requested.maxIeRatio,
  };
}
