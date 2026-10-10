/*
 * Funcionalidad: Definición simulable de un caso clínico
 * Descripción: Tipos de los bloques JSON del caso clínico (historia, mecánica respiratoria, ajustes iniciales del ventilador, estado inicial, eventos programados, objetivos y rúbrica) y las vistas que expone la fachada (instantánea del caso y caso listo para simular) con nombres y unidades alineados al motor fisiológico, sin depender de la feature de simulación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import {
  type AssistancePolicyValue,
  type CaseEventTypeValue,
  type CaseFlowPatternValue,
  type CaseMandatoryBreathTypeValue,
  type CaseTriggerTypeValue,
  type CaseVentilationModeValue,
  type PatientSexValue,
  type RubricCriterionTypeValue,
} from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";

export interface ClinicalCaseHistory {
  readonly presentIllness: string;
  readonly relevantHistory: readonly string[];
}

export interface RecruitmentCurvePoint {
  readonly peepCmH2O: number;
  readonly shuntFraction: number;
}

export interface PatientEffortProfile {
  readonly amplitudeCmH2O: number;
  readonly rateBpm: number;
  readonly inspiratoryFraction: number;
}

export interface HemodynamicEffectProfile {
  readonly baselineMapMmHg: number;
  readonly meanAirwayPressureThresholdCmH2O: number;
  readonly mapDropPerCmH2O: number;
}

export interface GasTimeConstants {
  readonly paco2TimeConstantMin: number;
  readonly oxygenTimeConstantS: number;
}

export interface DeteriorationProfile {
  readonly ratePerMin: number;
  readonly maxComplianceLossFraction: number;
  readonly maxShuntIncrease: number;
}

export interface ClinicalCaseMechanics {
  readonly complianceMlPerCmH2O: number;
  readonly resistanceCmH2OPerLps: number;
  readonly deadSpaceMl: number;
  readonly vco2MlPerMin: number;
  readonly bicarbonateMmolPerL: number;
  readonly hemoglobinGPerDl: number;
  readonly arteriovenousO2DifferenceMlPerDl: number;
  readonly basalShuntFraction: number;
  readonly recruitmentCurve: readonly RecruitmentCurvePoint[];
  readonly patientEffort: PatientEffortProfile;
  readonly hemodynamics: HemodynamicEffectProfile;
  readonly gasTimeConstants: GasTimeConstants;
  readonly deterioration: DeteriorationProfile;
}

export interface ClinicalCaseVentilatorSettings {
  readonly mode: CaseVentilationModeValue;
  readonly tidalVolumeMl?: number;
  readonly respiratoryRateBpm?: number;
  readonly peepCmH2O?: number;
  readonly fio2?: number;
  readonly inspiratoryTimeS?: number;
  readonly flowPattern?: CaseFlowPatternValue;
  readonly inspiratoryPauseS?: number;
  readonly inspiratoryPressureCmH2O?: number;
  readonly pressureSupportCmH2O?: number;
  readonly triggerType?: CaseTriggerTypeValue;
  readonly flowTriggerLpm?: number;
  readonly pressureTriggerCmH2O?: number;
  readonly cycleOffPercent?: number;
  readonly apneaTimeS?: number;
  readonly simvMandatoryType?: CaseMandatoryBreathTypeValue;
}

export interface ClinicalCaseInitialState {
  readonly paco2MmHg: number;
  readonly pao2MmHg: number;
}

export interface ClinicalCaseEvent {
  readonly simTimeMs: number;
  readonly type: CaseEventTypeValue;
  readonly resistanceFactor?: number;
  readonly complianceFactor?: number;
  readonly shuntIncrease?: number;
  readonly effortAmplitudeCmH2O?: number;
  readonly effortRateBpm?: number;
}

export interface CaseTargetRange {
  readonly min: number;
  readonly max: number;
}

export interface ClinicalCaseTargets {
  readonly spo2Percent?: CaseTargetRange;
  readonly paco2MmHg?: CaseTargetRange;
  readonly ph?: CaseTargetRange;
  readonly plateauPressureMaxCmH2O?: number;
  readonly drivingPressureMaxCmH2O?: number;
  readonly tidalVolumePerKgPbw?: CaseTargetRange;
  readonly autoPeepMaxCmH2O?: number;
}

export interface RubricCriterion {
  readonly type: RubricCriterionTypeValue;
  readonly weight: number;
  readonly threshold: number;
  readonly windowMinutes?: number;
  readonly penaltyPoints?: number;
}

export interface ClinicalCaseRubric {
  readonly assistancePolicy: AssistancePolicyValue;
  readonly passingScore: number;
  readonly criteria: readonly RubricCriterion[];
}

export interface ClinicalCaseSimulationProfile {
  readonly patientSex?: PatientSexValue;
  readonly patientHeightCm?: number;
  readonly mechanics?: ClinicalCaseMechanics;
  readonly initialVentilatorSettings?: ClinicalCaseVentilatorSettings;
  readonly initialState?: ClinicalCaseInitialState;
  readonly events: readonly ClinicalCaseEvent[];
  readonly targets?: ClinicalCaseTargets;
  readonly defaultRubric?: ClinicalCaseRubric;
}

export interface ClinicalCaseSnapshot {
  readonly id: string;
  readonly title: string;
  readonly status: ClinicalCaseStatusValue;
  readonly validatedByExpert: boolean;
  readonly difficulty: CaseDifficultyValue;
  readonly pathology: PathologyValue;
  readonly patientAge: number;
  readonly patientWeightKg: number;
  readonly simulationReady: boolean;
  readonly simulation: ClinicalCaseSimulationProfile;
}

export interface SimulationReadyClinicalCase {
  readonly id: string;
  readonly title: string;
  readonly validatedByExpert: boolean;
  readonly patientSex: PatientSexValue;
  readonly patientHeightCm: number;
  readonly patientWeightKg: number;
  readonly mechanics: ClinicalCaseMechanics;
  readonly initialVentilatorSettings: ClinicalCaseVentilatorSettings;
  readonly initialState: ClinicalCaseInitialState;
  readonly events: readonly ClinicalCaseEvent[];
  readonly targets: ClinicalCaseTargets;
  readonly defaultRubric?: ClinicalCaseRubric;
}
