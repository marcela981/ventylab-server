/*
 * Funcionalidad: Casos clínicos listos para el motor fisiológico
 * Descripción: Datos de siembra de cuatro casos simulables (pulmón normal, SDRA en paciente obeso, exacerbación de EPOC y crisis asmática) con cada valor numérico dentro de CLINICAL_CASE_PHYSIOLOGICAL_RANGES y su fuente bibliográfica; los consume prisma/seed-clinical-cases.ts
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseRubric } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

export interface EngineReadySeedCase {
  readonly id: string;
  readonly content: ClinicalCaseContent;
}

// Pedagogical scoring parameters chosen by the author (not physiological measurements); safety thresholds follow
// ARDSNet 2000 (Pplat <= 30 cmH2O, Vt <= 8 mL/kg PBW) and Amato 2015 NEJM (driving pressure <= 15 cmH2O).
function buildDefaultRubric(autoPeepMaxCmH2O: number): ClinicalCaseRubric {
  return {
    assistancePolicy: "DISABLED",
    passingScore: 70,
    criteria: [
      { type: "TARGETS_REACHED", weight: 40, threshold: 1 },
      { type: "TIME_TO_STABILIZE", weight: 20, threshold: 600 },
      { type: "TIME_IN_RANGE", weight: 40, threshold: 80, windowMinutes: 5 },
      { type: "PLATEAU_PRESSURE_LIMIT", weight: 0, threshold: 30, penaltyPoints: 5 },
      { type: "DRIVING_PRESSURE_LIMIT", weight: 0, threshold: 15, penaltyPoints: 5 },
      { type: "TIDAL_VOLUME_LIMIT", weight: 0, threshold: 8, penaltyPoints: 5 },
      { type: "AUTO_PEEP_LIMIT", weight: 0, threshold: autoPeepMaxCmH2O, penaltyPoints: 5 },
      { type: "AI_ASSIST_USAGE", weight: 0, threshold: 0, penaltyPoints: 5 },
    ],
  };
}

export const ENGINE_READY_CLINICAL_CASES: readonly EngineReadySeedCase[] = [
  {
    id: "engine-normal-lung",
    content: {
      title: "Pulmón normal: postoperatorio inmediato",
      description: "Paciente de 45 años en ventilación controlada tras cirugía abdominal electiva, sin enfermedad pulmonar previa.",
      summary: "Mecánica respiratoria normal; ajuste de ventilación protectora por peso predicho.",
      history: { presentIllness: "Postoperatorio inmediato de colecistectomía abierta, sedado y sin esfuerzo inspiratorio.", relevantHistory: ["Sin antecedentes pulmonares"] },
      patientAge: 45,
      patientWeight: 75,
      mainDiagnosis: "Postoperatorio sin enfermedad pulmonar",
      comorbidities: [],
      labData: { ph: 7.4, paco2: 40, pao2: 95, hco3: 24 },
      difficulty: "BEGINNER",
      pathology: "NORMAL",
      educationalGoal: "Programar un volumen corriente de 6-8 mL/kg de peso predicho y mantener gases normales.",
      simulation: {
        patientSex: "MALE",
        // 175 cm -> predicted body weight 70.6 kg (ARDSNet 2000 formula)
        patientHeightCm: 175,
        mechanics: {
          // Normal ventilated Crs 50-100 mL/cmH2O (Hess & Kacmarek, Essentials of Mechanical Ventilation 4th ed.)
          complianceMlPerCmH2O: 60,
          // Intubated adult with normal airways 5-10 cmH2O/L/s including the tube (Hess & Kacmarek)
          resistanceCmH2OPerLps: 8,
          // Anatomic dead space ~1 mL/lb ideal body weight (Radford 1955)
          deadSpaceMl: 150,
          // Resting VCO2 ~200 mL/min (West's Respiratory Physiology 10th ed.)
          vco2MlPerMin: 200,
          // Normal HCO3 22-26 mmol/L (West)
          bicarbonateMmolPerL: 24,
          // Normal adult male hemoglobin 13-17 g/dL (West)
          hemoglobinGPerDl: 14,
          // Normal arteriovenous O2 difference ~5 mL/dL (West)
          arteriovenousO2DifferenceMlPerDl: 5,
          // Normal physiological shunt <= 5% (West)
          basalShuntFraction: 0.05,
          // Normal lungs are not recruitable: shunt does not change with PEEP (Gattinoni 2006 NEJM)
          recruitmentCurve: [{ peepCmH2O: 0, shuntFraction: 0.05 }],
          // Sedated controlled ventilation: no effort; Ti/Ttot 0.35 in healthy breathing (Tobin 1983 Chest)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // MAP 70-105 mmHg normal; Paw threshold/drop are model parameters (Pinsky 2005 Chest)
          hemodynamics: { baselineMapMmHg: 85, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1 },
          // Model parameters: new PaCO2 steady state ~10-15 min, PaO2 ~5-10 min after a change (West; Hess & Kacmarek)
          gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
          // Stable scenario: no deterioration
          deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
        },
        // Initial VCV settings: Vt 500 mL (~7 mL/kg PBW), RR 12, PEEP 5, FiO2 0.4 (Hess & Kacmarek initial settings)
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 500,
          respiratoryRateBpm: 12,
          peepCmH2O: 5,
          fio2: 0.4,
          inspiratoryTimeS: 1,
          flowPattern: "SQUARE",
          inspiratoryPauseS: 0,
        },
        // Normal arterial gases on room air: PaCO2 35-45, PaO2 80-100 mmHg (West)
        initialState: { paco2MmHg: 40, pao2MmHg: 95 },
        events: [],
        targets: {
          // SpO2 94-98% for most adults (O'Driscoll BR et al. BTS guideline, Thorax 2017;72:i1-90)
          spo2Percent: { min: 94, max: 98 },
          // Normal PaCO2 35-45 mmHg and pH 7.35-7.45 (West)
          paco2MmHg: { min: 35, max: 45 },
          ph: { min: 7.35, max: 7.45 },
          // Pplat <= 30 (ARDSNet 2000), driving pressure <= 15 (Amato 2015), Vt 6-8 mL/kg PBW (Hess & Kacmarek)
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 6, max: 8 },
          // Conservative auto-PEEP limit of 5 cmH2O (Marini & Dries, Critical Care Medicine 5th ed.)
          autoPeepMaxCmH2O: 5,
        },
        defaultRubric: buildDefaultRubric(5),
      },
    },
  },
  {
    id: "engine-ards-obese",
    content: {
      title: "SDRA moderado en paciente con obesidad",
      description: "Mujer de 52 años, IMC 47, con SDRA por neumonía; ventilada inicialmente con un volumen calculado por peso real.",
      summary: "SDRA moderado (PaO2/FiO2 ~108) con pared torácica rígida por obesidad.",
      history: { presentIllness: "Neumonía adquirida en la comunidad con hipoxemia progresiva e intubación.", relevantHistory: ["Obesidad grado III", "Hipertensión arterial"] },
      patientAge: 52,
      patientWeight: 120,
      mainDiagnosis: "SDRA moderado por neumonía",
      comorbidities: ["Obesidad", "HTA"],
      labData: { ph: 7.32, paco2: 48, pao2: 65, hco3: 24, fio2: 0.6 },
      difficulty: "ADVANCED",
      pathology: "SDRA",
      educationalGoal: "Calcular el volumen corriente por peso predicho (no por peso real), titular PEEP y respetar presión meseta y de distensión.",
      simulation: {
        patientSex: "FEMALE",
        // 160 cm -> predicted body weight 52.4 kg (ARDSNet 2000 formula)
        patientHeightCm: 160,
        mechanics: {
          // Moderate ARDS Crs ~20-40 mL/cmH2O (Gattinoni & Pesenti 2005); obesity lowers total compliance (Pelosi P et al. Anesth Analg 1998;87:654-60)
          complianceMlPerCmH2O: 25,
          // Mildly raised resistance in ARDS (Hess & Kacmarek)
          resistanceCmH2OPerLps: 12,
          // Vd/Vt ~0.55-0.6 in early ARDS at ~6 mL/kg PBW (Nuckton TJ et al. NEJM 2002;346:1281-6)
          deadSpaceMl: 180,
          // Raised VCO2 with fever and higher body mass (West)
          vco2MlPerMin: 250,
          // Acute illness without chronic compensation (West)
          bicarbonateMmolPerL: 24,
          // Lower-normal female hemoglobin (West)
          hemoglobinGPerDl: 12,
          // Normal arteriovenous O2 difference (West)
          arteriovenousO2DifferenceMlPerDl: 5,
          // Shunt ~0.25-0.5 in ARDS (Dantzker 1979)
          basalShuntFraction: 0.3,
          // Shunt falls with PEEP in recruitable lungs (Gattinoni 2006 NEJM); obese patients need higher PEEP (Pirrone M et al. Crit Care Med 2016;44:300-7)
          recruitmentCurve: [
            { peepCmH2O: 5, shuntFraction: 0.3 },
            { peepCmH2O: 10, shuntFraction: 0.22 },
            { peepCmH2O: 15, shuntFraction: 0.17 },
          ],
          // Deep sedation without effort; Ti/Ttot 0.35 (Tobin 1983)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // MAP above the 65 mmHg goal (Surviving Sepsis 2021); Paw threshold/drop are model parameters (Pinsky 2005)
          hemodynamics: { baselineMapMmHg: 75, meanAirwayPressureThresholdCmH2O: 15, mapDropPerCmH2O: 1.5 },
          // Model parameters; oxygenation equilibrates more slowly in ARDS (Hess & Kacmarek)
          gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 180 },
          // Scenario: slow progression if left unattended (model parameter)
          deterioration: { ratePerMin: 0.01, maxComplianceLossFraction: 0.2, maxShuntIncrease: 0.1 },
        },
        // Vt 500 mL = 9.5 mL/kg PBW: the classic error of using actual weight (ARDSNet 2000); FiO2 0.6, PEEP 5 (low PEEP/FiO2 table start)
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 500,
          respiratoryRateBpm: 18,
          peepCmH2O: 5,
          fio2: 0.6,
          inspiratoryTimeS: 0.9,
          flowPattern: "SQUARE",
          inspiratoryPauseS: 0,
        },
        // PaO2/FiO2 65/0.6 = 108: moderate ARDS (ARDS Definition Task Force, JAMA 2012;307:2526-33)
        initialState: { paco2MmHg: 48, pao2MmHg: 65 },
        events: [
          // Derecruitment after open suctioning at minute 10 (Maggiore SM et al. Am J Respir Crit Care Med 2003;167:1215-24)
          { simTimeMs: 600000, type: "DERECRUITMENT", complianceFactor: 0.85, shuntIncrease: 0.05 },
        ],
        targets: {
          // ARDSNet 2000 goals: SpO2 88-95%, pH 7.30-7.45, Pplat <= 30, Vt 4-8 mL/kg PBW; permissive hypercapnia
          spo2Percent: { min: 88, max: 95 },
          paco2MmHg: { min: 35, max: 60 },
          ph: { min: 7.3, max: 7.45 },
          plateauPressureMaxCmH2O: 30,
          // Driving pressure <= 15 cmH2O (Amato 2015 NEJM)
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 4, max: 8 },
          // Conservative auto-PEEP limit (Marini & Dries)
          autoPeepMaxCmH2O: 5,
        },
        defaultRubric: buildDefaultRubric(5),
      },
    },
  },
  {
    id: "engine-copd-exacerbation",
    content: {
      title: "Exacerbación de EPOC con hiperinflación dinámica",
      description: "Hombre de 68 años con EPOC grave intubado por acidosis respiratoria; la programación inicial genera atrapamiento aéreo.",
      summary: "Resistencia alta, retención crónica de CO2 y riesgo de auto-PEEP.",
      history: { presentIllness: "Exacerbación infecciosa con fracaso de ventilación no invasiva.", relevantHistory: ["EPOC GOLD 4", "Tabaquismo 50 paquetes-año"] },
      patientAge: 68,
      patientWeight: 68,
      mainDiagnosis: "EPOC exacerbado con acidosis respiratoria",
      comorbidities: ["Tabaquismo"],
      labData: { ph: 7.28, paco2: 65, pao2: 55, hco3: 32 },
      difficulty: "INTERMEDIATE",
      pathology: "EPOC",
      educationalGoal: "Reducir la hiperinflación dinámica alargando el tiempo espiratorio y aceptar la PaCO2 basal del paciente.",
      simulation: {
        patientSex: "MALE",
        // 170 cm -> predicted body weight 66.2 kg (ARDSNet 2000 formula)
        patientHeightCm: 170,
        mechanics: {
          // Static compliance normal or high in emphysema (Hess & Kacmarek)
          complianceMlPerCmH2O: 60,
          // Exacerbation resistance ~15-25 cmH2O/L/s or more (Marini & Dries; Hess & Kacmarek)
          resistanceCmH2OPerLps: 22,
          // Raised physiological dead space from V/Q mismatch (West)
          deadSpaceMl: 220,
          // Raised VCO2 with work of breathing and infection (West)
          vco2MlPerMin: 220,
          // Chronic compensation ~3.5 mmol/L per 10 mmHg PaCO2 rise (West)
          bicarbonateMmolPerL: 32,
          // Upper-normal hemoglobin in chronic hypoxemia (West)
          hemoglobinGPerDl: 15,
          // Normal arteriovenous O2 difference (West)
          arteriovenousO2DifferenceMlPerDl: 5,
          // Hypoxemia mostly from V/Q mismatch, small true shunt (West)
          basalShuntFraction: 0.1,
          // Extrinsic PEEP does not recruit in COPD (Marini & Dries)
          recruitmentCurve: [{ peepCmH2O: 0, shuntFraction: 0.1 }],
          // Sedated after intubation; Ti/Ttot 0.35 (Tobin 1983)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // Hyperinflation lowers venous return at lower Paw (Pinsky 2005); model parameters
          hemodynamics: { baselineMapMmHg: 80, meanAirwayPressureThresholdCmH2O: 12, mapDropPerCmH2O: 2 },
          // Larger CO2 stores and slow O2 equilibration with V/Q mismatch (West; Hess & Kacmarek)
          gasTimeConstants: { paco2TimeConstantMin: 8, oxygenTimeConstantS: 300 },
          // Stable scenario: no deterioration
          deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
        },
        // RR 20 with Ti 1 s leaves 2 s to exhale through high resistance: auto-PEEP to correct (Marini & Dries)
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 500,
          respiratoryRateBpm: 20,
          peepCmH2O: 5,
          fio2: 0.35,
          inspiratoryTimeS: 1,
          flowPattern: "SQUARE",
          inspiratoryPauseS: 0,
        },
        // Acute-on-chronic hypercapnic failure (GOLD 2024 report; West)
        initialState: { paco2MmHg: 65, pao2MmHg: 55 },
        events: [
          // Secretions raise airway resistance at minute 10 (Hess & Kacmarek)
          { simTimeMs: 600000, type: "SECRETIONS", resistanceFactor: 1.3 },
        ],
        targets: {
          // SpO2 88-92% in hypercapnic COPD (GOLD 2024 report)
          spo2Percent: { min: 88, max: 92 },
          // Return to the chronic baseline, avoid post-hypercapnic alkalosis (Hess & Kacmarek)
          paco2MmHg: { min: 50, max: 65 },
          ph: { min: 7.3, max: 7.45 },
          // Pplat <= 30 (ARDSNet 2000), driving pressure <= 15 (Amato 2015), Vt 6-8 mL/kg PBW (Hess & Kacmarek)
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 6, max: 8 },
          // Minimise dynamic hyperinflation (Marini & Dries)
          autoPeepMaxCmH2O: 5,
        },
        defaultRubric: buildDefaultRubric(5),
      },
    },
  },
  {
    id: "engine-asthma-crisis",
    content: {
      title: "Crisis asmática grave",
      description: "Mujer de 28 años con asma casi fatal intubada; la frecuencia inicial produce atrapamiento aéreo e hipotensión.",
      summary: "Resistencia muy alta; requiere frecuencia baja y tiempo espiratorio largo.",
      history: { presentIllness: "Crisis asmática refractaria a broncodilatadores y corticoide sistémico.", relevantHistory: ["Asma persistente grave", "Dos ingresos previos a UCI"] },
      patientAge: 28,
      patientWeight: 60,
      mainDiagnosis: "Asma casi fatal",
      comorbidities: [],
      labData: { ph: 7.25, paco2: 60, pao2: 70, hco3: 22 },
      difficulty: "ADVANCED",
      pathology: "ASMA",
      educationalGoal: "Aplicar hipoventilación controlada: frecuencia baja, tiempo espiratorio largo e hipercapnia permisiva.",
      simulation: {
        patientSex: "FEMALE",
        // 165 cm -> predicted body weight 57.0 kg (ARDSNet 2000 formula)
        patientHeightCm: 165,
        mechanics: {
          // Static compliance close to normal; hyperinflation affects dynamic values (Leatherman JW. Chest 2015;147:1671-80)
          complianceMlPerCmH2O: 45,
          // Severe asthma resistance 20-50 cmH2O/L/s or more (Leatherman 2015; Marini & Dries)
          resistanceCmH2OPerLps: 35,
          // Anatomic dead space plus V/Q mismatch (Radford 1955; West)
          deadSpaceMl: 180,
          // Raised VCO2 from work of breathing (West)
          vco2MlPerMin: 250,
          // Acute respiratory acidosis with slight metabolic component (West)
          bicarbonateMmolPerL: 22,
          // Normal female hemoglobin (West)
          hemoglobinGPerDl: 13,
          // Normal arteriovenous O2 difference (West)
          arteriovenousO2DifferenceMlPerDl: 5,
          // Hypoxemia mostly from V/Q mismatch (West)
          basalShuntFraction: 0.08,
          // Not recruitable with extrinsic PEEP (Leatherman 2015)
          recruitmentCurve: [{ peepCmH2O: 0, shuntFraction: 0.08 }],
          // Sedated, often paralysed early (Leatherman 2015); Ti/Ttot 0.35 (Tobin 1983)
          patientEffort: { amplitudeCmH2O: 0, rateBpm: 0, inspiratoryFraction: 0.35 },
          // Dynamic hyperinflation causes hypotension (Leatherman 2015; Pinsky 2005); model parameters
          hemodynamics: { baselineMapMmHg: 80, meanAirwayPressureThresholdCmH2O: 12, mapDropPerCmH2O: 2.5 },
          // Model parameters (West; Hess & Kacmarek)
          gasTimeConstants: { paco2TimeConstantMin: 4, oxygenTimeConstantS: 120 },
          // Stable scenario except the scheduled bronchospasm
          deterioration: { ratePerMin: 0, maxComplianceLossFraction: 0, maxShuntIncrease: 0 },
        },
        // RR 20 is above the recommended 10-14 for severe asthma (Leatherman 2015): auto-PEEP to correct
        initialVentilatorSettings: {
          mode: "VCV",
          tidalVolumeMl: 450,
          respiratoryRateBpm: 20,
          peepCmH2O: 5,
          fio2: 0.5,
          inspiratoryTimeS: 1,
          flowPattern: "SQUARE",
          inspiratoryPauseS: 0,
        },
        // Hypercapnic severe asthma (Leatherman 2015)
        initialState: { paco2MmHg: 60, pao2MmHg: 70 },
        events: [
          // Recurrent bronchospasm at minute 15 (Marini & Dries)
          { simTimeMs: 900000, type: "BRONCHOSPASM", resistanceFactor: 1.4 },
        ],
        targets: {
          // SpO2 94-98% (O'Driscoll BR et al. BTS guideline, Thorax 2017)
          spo2Percent: { min: 94, max: 98 },
          // Permissive hypercapnia accepted while pH >= 7.20 (Leatherman 2015)
          paco2MmHg: { min: 35, max: 70 },
          ph: { min: 7.2, max: 7.45 },
          // Pplat < 30 cmH2O (Leatherman 2015), driving pressure <= 15 (Amato 2015), Vt 6-8 mL/kg PBW (Leatherman 2015)
          plateauPressureMaxCmH2O: 30,
          drivingPressureMaxCmH2O: 15,
          tidalVolumePerKgPbw: { min: 6, max: 8 },
          // Intrinsic PEEP kept below ~10 cmH2O (Leatherman 2015)
          autoPeepMaxCmH2O: 10,
        },
        defaultRubric: buildDefaultRubric(10),
      },
    },
  },
];
