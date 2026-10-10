/*
 * Funcionalidad: Valores enumerados de la definición simulable de un caso clínico
 * Descripción: Sexo del paciente, modos y patrones del ventilador, tipos de evento programado, criterios de rúbrica y política de asistencia de IA usados por la definición fisiológica del caso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type PatientSexValue = "MALE" | "FEMALE";

export const PATIENT_SEX_VALUES: readonly PatientSexValue[] = ["MALE", "FEMALE"] as const;

export type CaseVentilationModeValue = "VCV" | "PCV" | "PSV" | "CPAP" | "SIMV";

export const CASE_VENTILATION_MODE_VALUES: readonly CaseVentilationModeValue[] = ["VCV", "PCV", "PSV", "CPAP", "SIMV"] as const;

export type CaseFlowPatternValue = "SQUARE" | "DECELERATING";

export const CASE_FLOW_PATTERN_VALUES: readonly CaseFlowPatternValue[] = ["SQUARE", "DECELERATING"] as const;

export type CaseTriggerTypeValue = "FLOW" | "PRESSURE";

export const CASE_TRIGGER_TYPE_VALUES: readonly CaseTriggerTypeValue[] = ["FLOW", "PRESSURE"] as const;

export type CaseMandatoryBreathTypeValue = "VCV" | "PCV";

export const CASE_MANDATORY_BREATH_TYPE_VALUES: readonly CaseMandatoryBreathTypeValue[] = ["VCV", "PCV"] as const;

export type CaseEventTypeValue = "BRONCHOSPASM" | "SECRETIONS" | "DERECRUITMENT" | "DISCONNECTION" | "RECONNECTION" | "EFFORT_CHANGE";

export const CASE_EVENT_TYPE_VALUES: readonly CaseEventTypeValue[] = [
  "BRONCHOSPASM",
  "SECRETIONS",
  "DERECRUITMENT",
  "DISCONNECTION",
  "RECONNECTION",
  "EFFORT_CHANGE",
] as const;

export type RubricCriterionTypeValue =
  | "TARGETS_REACHED"
  | "TIME_TO_STABILIZE"
  | "TIME_IN_RANGE"
  | "PLATEAU_PRESSURE_LIMIT"
  | "DRIVING_PRESSURE_LIMIT"
  | "TIDAL_VOLUME_LIMIT"
  | "AUTO_PEEP_LIMIT"
  | "AI_ASSIST_USAGE";

export const RUBRIC_CRITERION_TYPE_VALUES: readonly RubricCriterionTypeValue[] = [
  "TARGETS_REACHED",
  "TIME_TO_STABILIZE",
  "TIME_IN_RANGE",
  "PLATEAU_PRESSURE_LIMIT",
  "DRIVING_PRESSURE_LIMIT",
  "TIDAL_VOLUME_LIMIT",
  "AUTO_PEEP_LIMIT",
  "AI_ASSIST_USAGE",
] as const;

export type AssistancePolicyValue = "DISABLED" | "ALLOWED_WITH_PENALTY";

export const ASSISTANCE_POLICY_VALUES: readonly AssistancePolicyValue[] = ["DISABLED", "ALLOWED_WITH_PENALTY"] as const;
