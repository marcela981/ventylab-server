/*
 * Funcionalidad: Pruebas de los límites del ventilador
 * Descripción: Verifica que las tablas de rangos del motor y del comando físico, derivadas de la fuente única común, conservan exactamente los valores y unidades previos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { MAX_AIRWAY_PRESSURE_SETTING_CMH2O, MAX_PEAK_INSPIRATORY_FLOW_LPM, MIN_EXPIRATORY_TIME_S, VENTILATOR_LIMITS } from "@/features/simulation/domain/engine/ventilator-limits";
import { VENTILATOR_SAFE_RANGES } from "@/features/simulation/domain/value-objects/ventilator-command";

describe("ventilator limits", () => {
  it("keeps the engine limits unchanged", () => {
    const expected: Record<string, { min: number; max: number; unit: string }> = {
      tidalVolumeMl: { min: 200, max: 800, unit: "mL" },
      respiratoryRateBpm: { min: 5, max: 40, unit: "breaths/min" },
      peepCmH2O: { min: 0, max: 20, unit: "cmH2O" },
      fio2: { min: 0.21, max: 1.0, unit: "fraction" },
      inspiratoryTimeS: { min: 0.5, max: 3.0, unit: "s" },
      inspiratoryPauseS: { min: 0, max: 2.0, unit: "s" },
      inspiratoryPressureCmH2O: { min: 5, max: 40, unit: "cmH2O above PEEP" },
      pressureSupportCmH2O: { min: 0, max: 30, unit: "cmH2O above PEEP" },
      flowTriggerLpm: { min: 0.5, max: 10, unit: "L/min" },
      pressureTriggerCmH2O: { min: 0.5, max: 10, unit: "cmH2O" },
      cycleOffPercent: { min: 5, max: 80, unit: "% of peak inspiratory flow" },
      apneaTimeS: { min: 10, max: 60, unit: "s" },
    };

    const actual: unknown = { ...VENTILATOR_LIMITS };

    expect(actual).toEqual(expected);
    expect([MAX_AIRWAY_PRESSURE_SETTING_CMH2O, MAX_PEAK_INSPIRATORY_FLOW_LPM, MIN_EXPIRATORY_TIME_S]).toEqual([50, 100, 0.3]);
  });

  it("keeps the physical command safe ranges unchanged", () => {
    const expected: Record<string, { min: number; max: number; unit: string }> = {
      PEEP: { min: 0, max: 20, unit: "cmH₂O" },
      FIO2: { min: 0.21, max: 1.0, unit: "fraction" },
      TIDAL_VOLUME: { min: 200, max: 800, unit: "ml" },
      RESPIRATORY_RATE: { min: 5, max: 40, unit: "breaths/min" },
      PRESSURE_LIMIT: { min: 10, max: 50, unit: "cmH₂O" },
      INSPIRATORY_TIME: { min: 0.5, max: 3.0, unit: "seconds" },
      FLOW_RATE: { min: 20, max: 100, unit: "L/min" },
    };

    const actual: unknown = { ...VENTILATOR_SAFE_RANGES };

    expect(actual).toEqual(expected);
  });
});
