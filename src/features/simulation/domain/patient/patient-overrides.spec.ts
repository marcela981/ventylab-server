/*
 * Funcionalidad: Pruebas de los ajustes del paciente simulado propio
 * Descripción: Verifica el caso base y la mecánica de cada condición (valores de julio), la corrección de la compliance por edad e IMC con su mínimo, la PaO2 por la inversa de Severinghaus, la PAM desde PAS/PAD, los límites a los rangos fisiológicos, que la dificultad y los datos para mostrar no cambien los ajustes y que el resultado sea determinista
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { severinghausSaturation } from "@/features/simulation/domain/engine/gas-exchange";
import {
  BASE_CASE_BY_CONDITION,
  baseCaseIdForCondition,
  buildPatientOverrides,
  meanArterialPressure,
  pao2FromSaturation,
  type PatientOverrides,
} from "@/features/simulation/domain/patient/patient-overrides";
import { PATIENT_CONDITION_VALUES, type PatientConditionValue, type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";

// 40 years, 70 kg, 175 cm: BMI 22.9, so neither the age nor the obesity correction applies
function patient(overrides: Partial<SimulatedPatient> = {}): SimulatedPatient {
  return {
    ageYears: 40,
    sex: "MALE",
    weightKg: 70,
    heightCm: 175,
    condition: "HEALTHY",
    difficulty: "BEGINNER",
    vitals: { respiratoryRateBpm: 20, spo2Percent: 90 },
    ...overrides,
  };
}

function overridesOf(input: Partial<SimulatedPatient>): PatientOverrides {
  return buildPatientOverrides({ id: "base" }, patient(input));
}

describe("buildPatientOverrides", () => {
  it.each<[PatientConditionValue, string, number, number]>([
    ["HEALTHY", "engine-normal-lung", 75, 3],
    ["NEUROMUSCULAR", "engine-normal-lung", 60, 3],
    ["POST_SURGICAL", "engine-normal-lung", 50, 5],
    ["ARDS_MILD", "july-sdra-sepsis", 40, 6],
    ["ARDS_MODERATE", "july-sdra-sepsis", 25, 8],
    ["ARDS_SEVERE", "july-sdra-sepsis", 15, 10],
    ["PULMONARY_EDEMA", "july-sdra-sepsis", 30, 6],
    ["PNEUMOTHORAX", "july-sdra-sepsis", 20, 5],
    ["COPD_MILD", "july-epoc-descompensado", 75, 8],
    ["COPD_MODERATE", "july-epoc-descompensado", 75, 12],
    ["COPD_SEVERE", "july-epoc-descompensado", 75, 18],
    ["ASTHMA_MILD", "engine-asthma-crisis", 75, 10],
    ["ASTHMA_MODERATE", "engine-asthma-crisis", 75, 15],
    ["ASTHMA_SEVERE", "engine-asthma-crisis", 75, 25],
    ["PNEUMONIA", "july-neumonia-grave", 35, 7],
    ["OBESITY_HYPOVENTILATION", "engine-ards-obese", 40, 3],
  ])("maps %s to base case %s with C %d and R %d", (condition: PatientConditionValue, baseCaseId: string, compliance: number, resistance: number) => {
    const result: PatientOverrides = overridesOf({ condition });

    expect(baseCaseIdForCondition(condition)).toBe(baseCaseId);
    expect([result.complianceMlPerCmH2O, result.resistanceCmH2OPerLps]).toEqual([compliance, resistance]);
  });

  it("covers every condition of the form", () => {
    expect(Object.keys(BASE_CASE_BY_CONDITION).sort()).toEqual([...PATIENT_CONDITION_VALUES].sort());
  });

  it("lowers the compliance 0.5 mL/cmH2O per year above 60", () => {
    expect(overridesOf({ ageYears: 70 }).complianceMlPerCmH2O).toBe(70);
    expect(overridesOf({ ageYears: 60 }).complianceMlPerCmH2O).toBe(75);
  });

  it("lowers the compliance 1 % per BMI point above 30", () => {
    // 100 kg, 160 cm -> BMI 39.06 -> 75 * (1 - 0.0906)
    expect(overridesOf({ weightKg: 100, heightCm: 160 }).complianceMlPerCmH2O).toBe(68.2);
  });

  it("never lowers the adjusted compliance below 15", () => {
    expect(overridesOf({ condition: "ARDS_SEVERE", ageYears: 90, weightKg: 200, heightCm: 150 }).complianceMlPerCmH2O).toBe(15);
  });

  it("takes sex, height, age and weight from the form and the respiratory rate as the initial ventilator rate", () => {
    const result: PatientOverrides = overridesOf({ sex: "FEMALE", heightCm: 160, ageYears: 68, weightKg: 65, vitals: { respiratoryRateBpm: 28, spo2Percent: 88 } });

    expect(result).toMatchObject({ baseCaseId: "base", patientSex: "FEMALE", patientHeightCm: 160, patientAge: 68, patientWeightKg: 65, respiratoryRateBpm: 28 });
  });

  it("limits the respiratory rate to the engine range", () => {
    expect(overridesOf({ vitals: { respiratoryRateBpm: 48, spo2Percent: 90 } }).respiratoryRateBpm).toBe(40);
  });

  it("derives the initial PaO2 from the SpO2 with the inverse Severinghaus equation", () => {
    const result: PatientOverrides = overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 90 } });

    expect(result.pao2MmHg).toBeCloseTo(58.7, 0);
    expect(severinghausSaturation(pao2FromSaturation(84))).toBeCloseTo(84, 6);
  });

  it("keeps the PaO2 within its physiological range at the extremes of the SpO2", () => {
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 50 } }).pao2MmHg).toBe(30);
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 100 } }).pao2MmHg).toBeLessThanOrEqual(600);
  });

  it("sets the baseline MAP to PAD + (PAS − PAD) / 3 within 50-120, and keeps the base MAP without both pressures", () => {
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 90, systolicMmHg: 150, diastolicMmHg: 90 } }).baselineMapMmHg).toBe(110);
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 90, systolicMmHg: 85, diastolicMmHg: 45 } }).baselineMapMmHg).toBe(58.3);
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 90, systolicMmHg: 240, diastolicMmHg: 140 } }).baselineMapMmHg).toBe(120);
    expect(overridesOf({ vitals: { respiratoryRateBpm: 20, spo2Percent: 90, systolicMmHg: 150 } }).baselineMapMmHg).toBeUndefined();
    expect(meanArterialPressure(120, 60)).toBe(80);
  });

  it("ignores the difficulty and the display-only data", () => {
    const plain: PatientOverrides = overridesOf({});
    const decorated: PatientOverrides = overridesOf({
      difficulty: "ADVANCED",
      displayName: "Juan",
      diagnosis: "Neumonía",
      allergies: ["Penicilina"],
      history: ["HTA"],
      vitals: { respiratoryRateBpm: 20, spo2Percent: 90, heartRateBpm: 130, temperatureC: 39, glasgow: 12, breathingPattern: "tachypneic" },
    });

    expect(decorated).toEqual(plain);
  });

  it("is deterministic", () => {
    const input: Partial<SimulatedPatient> = { condition: "COPD_SEVERE", ageYears: 75, weightKg: 95, heightCm: 165, vitals: { respiratoryRateBpm: 26, spo2Percent: 86 } };

    expect(overridesOf(input)).toEqual(overridesOf(input));
  });
});
