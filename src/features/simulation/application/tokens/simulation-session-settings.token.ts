/*
 * Funcionalidad: Token de ajustes de las sesiones de simulación
 * Descripción: Ajustes de las sesiones con eventos (cada lectura devuelve el valor vigente de los ajustes de la plataforma): tolerancia del tiempo simulado frente al tiempo real, inactividad para marcar una sesión como abandonada, tamaño máximo de un lote de eventos, umbrales de la rúbrica por defecto y multiplicadores de tiempo permitidos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TimeMultiplier } from "@/features/simulation/domain/engine/engine.types";
import { type SimulationRubricThresholds } from "@/features/simulation/domain/scoring/simulation-rubric";

export const SIMULATION_SESSION_SETTINGS_TOKEN: unique symbol = Symbol("SIMULATION_SESSION_SETTINGS_TOKEN");

export interface SimulationSessionSettings {
  readonly eventTimeToleranceMs: number;
  readonly abandonAfterMs: number;
  readonly maxEventBatchSize: number;
  readonly defaultRubricThresholds: SimulationRubricThresholds;
  readonly allowedTimeMultipliers: readonly TimeMultiplier[];
}
