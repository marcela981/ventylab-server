/*
 * Funcionalidad: Validador de la definición de un caso clínico
 * Descripción: Rechaza valores fisiológicamente implausibles según CLINICAL_CASE_PHYSIOLOGICAL_RANGES (ClinicalCasePhysiologicalRangeError) y definiciones inconsistentes de eventos, objetivos, ajustes y rúbrica (InvalidClinicalCaseDefinitionError)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  CLINICAL_CASE_PHYSIOLOGICAL_RANGES,
  type PhysiologicalParameter,
  type PhysiologicalRange,
} from "@/features/clinical-cases/domain/clinical-case-physiological-ranges";
import { ClinicalCasePhysiologicalRangeError, InvalidClinicalCaseDefinitionError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import {
  type CaseTargetRange,
  type ClinicalCaseEvent,
  type ClinicalCaseMechanics,
  type ClinicalCaseRubric,
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseTargets,
  type ClinicalCaseVentilatorSettings,
  type RecruitmentCurvePoint,
  type RubricCriterion,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import {
  ASSISTANCE_POLICY_VALUES,
  CASE_EVENT_TYPE_VALUES,
  CASE_FLOW_PATTERN_VALUES,
  CASE_MANDATORY_BREATH_TYPE_VALUES,
  CASE_TRIGGER_TYPE_VALUES,
  CASE_VENTILATION_MODE_VALUES,
  type CaseEventTypeValue,
  PATIENT_SEX_VALUES,
  RUBRIC_CRITERION_TYPE_VALUES,
  type RubricCriterionTypeValue,
} from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";

export interface ClinicalCaseDefinitionToValidate {
  readonly patientAge: number;
  readonly patientWeight: number;
  readonly simulation: ClinicalCaseSimulationProfile;
}

type EventParameter = "resistanceFactor" | "complianceFactor" | "shuntIncrease" | "effortAmplitudeCmH2O" | "effortRateBpm";

const EVENT_PARAMETERS: readonly EventParameter[] = ["resistanceFactor", "complianceFactor", "shuntIncrease", "effortAmplitudeCmH2O", "effortRateBpm"];

const EVENT_PARAMETER_RANGES: Readonly<Record<EventParameter, PhysiologicalParameter>> = {
  resistanceFactor: "eventResistanceFactor",
  complianceFactor: "eventComplianceFactor",
  shuntIncrease: "eventShuntIncrease",
  effortAmplitudeCmH2O: "effortAmplitudeCmH2O",
  effortRateBpm: "effortRateBpm",
};

const EVENT_ALLOWED_PARAMETERS: Readonly<Record<CaseEventTypeValue, readonly EventParameter[]>> = {
  BRONCHOSPASM: ["resistanceFactor"],
  SECRETIONS: ["resistanceFactor"],
  DERECRUITMENT: ["complianceFactor", "shuntIncrease"],
  DISCONNECTION: [],
  RECONNECTION: [],
  EFFORT_CHANGE: ["effortAmplitudeCmH2O", "effortRateBpm"],
};

const MIN_EXPIRATORY_TIME_S: number = 0.3;
const RUBRIC_TOTAL_WEIGHT: number = 100;
const RUBRIC_WEIGHT_TOLERANCE: number = 0.000001;
const SECONDS_PER_MINUTE: number = 60;

export function assertValidClinicalCaseDefinition(definition: ClinicalCaseDefinitionToValidate): void {
  const simulation: ClinicalCaseSimulationProfile = definition.simulation;

  assertInRange("patientAgeYears", "patientAge", definition.patientAge);
  assertInRange("patientWeightKg", "patientWeight", definition.patientWeight);
  assertInRange("patientHeightCm", "patientHeightCm", simulation.patientHeightCm);

  if (simulation.patientSex !== undefined && !PATIENT_SEX_VALUES.includes(simulation.patientSex)) {
    throw new InvalidClinicalCaseDefinitionError("patientSex");
  }

  if (simulation.mechanics) {
    assertValidMechanics(simulation.mechanics);
  }

  if (simulation.initialVentilatorSettings) {
    assertValidSettings(simulation.initialVentilatorSettings);
  }

  if (simulation.initialState) {
    assertInRange("paco2MmHg", "initialState.paco2MmHg", simulation.initialState.paco2MmHg);
    assertInRange("pao2MmHg", "initialState.pao2MmHg", simulation.initialState.pao2MmHg);
  }

  assertValidEvents(simulation.events);

  if (simulation.targets) {
    assertValidTargets(simulation.targets);
  }

  if (simulation.defaultRubric) {
    assertValidRubric(simulation.defaultRubric);
  }
}

function assertInRange(parameter: PhysiologicalParameter, field: string, value: number | undefined): void {
  if (value === undefined) {
    return;
  }

  const range: PhysiologicalRange = CLINICAL_CASE_PHYSIOLOGICAL_RANGES[parameter];

  if (!Number.isFinite(value) || value < range.min || value > range.max) {
    throw new ClinicalCasePhysiologicalRangeError(field, value, range.min, range.max, range.unit);
  }
}

function assertValidMechanics(mechanics: ClinicalCaseMechanics): void {
  assertInRange("complianceMlPerCmH2O", "mechanics.complianceMlPerCmH2O", mechanics.complianceMlPerCmH2O);
  assertInRange("resistanceCmH2OPerLps", "mechanics.resistanceCmH2OPerLps", mechanics.resistanceCmH2OPerLps);
  assertInRange("deadSpaceMl", "mechanics.deadSpaceMl", mechanics.deadSpaceMl);
  assertInRange("vco2MlPerMin", "mechanics.vco2MlPerMin", mechanics.vco2MlPerMin);
  assertInRange("bicarbonateMmolPerL", "mechanics.bicarbonateMmolPerL", mechanics.bicarbonateMmolPerL);
  assertInRange("hemoglobinGPerDl", "mechanics.hemoglobinGPerDl", mechanics.hemoglobinGPerDl);
  assertInRange("arteriovenousO2DifferenceMlPerDl", "mechanics.arteriovenousO2DifferenceMlPerDl", mechanics.arteriovenousO2DifferenceMlPerDl);
  assertInRange("shuntFraction", "mechanics.basalShuntFraction", mechanics.basalShuntFraction);
  assertInRange("effortAmplitudeCmH2O", "mechanics.patientEffort.amplitudeCmH2O", mechanics.patientEffort.amplitudeCmH2O);
  assertInRange("effortRateBpm", "mechanics.patientEffort.rateBpm", mechanics.patientEffort.rateBpm);
  assertInRange("inspiratoryFraction", "mechanics.patientEffort.inspiratoryFraction", mechanics.patientEffort.inspiratoryFraction);
  assertInRange("baselineMapMmHg", "mechanics.hemodynamics.baselineMapMmHg", mechanics.hemodynamics.baselineMapMmHg);
  assertInRange(
    "meanAirwayPressureThresholdCmH2O",
    "mechanics.hemodynamics.meanAirwayPressureThresholdCmH2O",
    mechanics.hemodynamics.meanAirwayPressureThresholdCmH2O,
  );
  assertInRange("mapDropPerCmH2O", "mechanics.hemodynamics.mapDropPerCmH2O", mechanics.hemodynamics.mapDropPerCmH2O);
  assertInRange("paco2TimeConstantMin", "mechanics.gasTimeConstants.paco2TimeConstantMin", mechanics.gasTimeConstants.paco2TimeConstantMin);
  assertInRange("oxygenTimeConstantS", "mechanics.gasTimeConstants.oxygenTimeConstantS", mechanics.gasTimeConstants.oxygenTimeConstantS);
  assertInRange("deteriorationRatePerMin", "mechanics.deterioration.ratePerMin", mechanics.deterioration.ratePerMin);
  assertInRange("maxComplianceLossFraction", "mechanics.deterioration.maxComplianceLossFraction", mechanics.deterioration.maxComplianceLossFraction);
  assertInRange("maxShuntIncrease", "mechanics.deterioration.maxShuntIncrease", mechanics.deterioration.maxShuntIncrease);

  let previousPeep: number | undefined;

  mechanics.recruitmentCurve.forEach((point: RecruitmentCurvePoint, index: number): void => {
    assertInRange("recruitmentPeepCmH2O", `mechanics.recruitmentCurve[${index}].peepCmH2O`, point.peepCmH2O);
    assertInRange("shuntFraction", `mechanics.recruitmentCurve[${index}].shuntFraction`, point.shuntFraction);

    if (previousPeep !== undefined && point.peepCmH2O <= previousPeep) {
      throw new InvalidClinicalCaseDefinitionError(`mechanics.recruitmentCurve[${index}].peepCmH2O`);
    }

    previousPeep = point.peepCmH2O;
  });
}

function assertValidSettings(settings: ClinicalCaseVentilatorSettings): void {
  if (!CASE_VENTILATION_MODE_VALUES.includes(settings.mode)) {
    throw new InvalidClinicalCaseDefinitionError("initialVentilatorSettings.mode");
  }

  if (settings.flowPattern !== undefined && !CASE_FLOW_PATTERN_VALUES.includes(settings.flowPattern)) {
    throw new InvalidClinicalCaseDefinitionError("initialVentilatorSettings.flowPattern");
  }

  if (settings.triggerType !== undefined && !CASE_TRIGGER_TYPE_VALUES.includes(settings.triggerType)) {
    throw new InvalidClinicalCaseDefinitionError("initialVentilatorSettings.triggerType");
  }

  if (settings.simvMandatoryType !== undefined && !CASE_MANDATORY_BREATH_TYPE_VALUES.includes(settings.simvMandatoryType)) {
    throw new InvalidClinicalCaseDefinitionError("initialVentilatorSettings.simvMandatoryType");
  }

  assertInRange("tidalVolumeMl", "initialVentilatorSettings.tidalVolumeMl", settings.tidalVolumeMl);
  assertInRange("respiratoryRateBpm", "initialVentilatorSettings.respiratoryRateBpm", settings.respiratoryRateBpm);
  assertInRange("peepCmH2O", "initialVentilatorSettings.peepCmH2O", settings.peepCmH2O);
  assertInRange("fio2", "initialVentilatorSettings.fio2", settings.fio2);
  assertInRange("inspiratoryTimeS", "initialVentilatorSettings.inspiratoryTimeS", settings.inspiratoryTimeS);
  assertInRange("inspiratoryPauseS", "initialVentilatorSettings.inspiratoryPauseS", settings.inspiratoryPauseS);
  assertInRange("inspiratoryPressureCmH2O", "initialVentilatorSettings.inspiratoryPressureCmH2O", settings.inspiratoryPressureCmH2O);
  assertInRange("pressureSupportCmH2O", "initialVentilatorSettings.pressureSupportCmH2O", settings.pressureSupportCmH2O);
  assertInRange("flowTriggerLpm", "initialVentilatorSettings.flowTriggerLpm", settings.flowTriggerLpm);
  assertInRange("pressureTriggerCmH2O", "initialVentilatorSettings.pressureTriggerCmH2O", settings.pressureTriggerCmH2O);
  assertInRange("cycleOffPercent", "initialVentilatorSettings.cycleOffPercent", settings.cycleOffPercent);
  assertInRange("apneaTimeS", "initialVentilatorSettings.apneaTimeS", settings.apneaTimeS);

  if (settings.respiratoryRateBpm !== undefined && settings.inspiratoryTimeS !== undefined) {
    const cycleTimeS: number = SECONDS_PER_MINUTE / settings.respiratoryRateBpm;
    const inspiratoryTotalS: number = settings.inspiratoryTimeS + (settings.inspiratoryPauseS ?? 0);

    if (inspiratoryTotalS > cycleTimeS - MIN_EXPIRATORY_TIME_S) {
      throw new InvalidClinicalCaseDefinitionError("initialVentilatorSettings.inspiratoryTimeS");
    }
  }
}

function assertValidEvents(events: readonly ClinicalCaseEvent[]): void {
  let previousTimeMs: number = 0;

  events.forEach((event: ClinicalCaseEvent, index: number): void => {
    const field: string = `events[${index}]`;

    if (!Number.isInteger(event.simTimeMs) || event.simTimeMs < 0 || event.simTimeMs < previousTimeMs) {
      throw new InvalidClinicalCaseDefinitionError(`${field}.simTimeMs`);
    }

    assertInRange("eventTimeMs", `${field}.simTimeMs`, event.simTimeMs);

    if (!CASE_EVENT_TYPE_VALUES.includes(event.type)) {
      throw new InvalidClinicalCaseDefinitionError(`${field}.type`);
    }

    const allowed: readonly EventParameter[] = EVENT_ALLOWED_PARAMETERS[event.type];
    const present: EventParameter[] = EVENT_PARAMETERS.filter((parameter: EventParameter) => event[parameter] !== undefined);
    const unknown: EventParameter | undefined = present.find((parameter: EventParameter) => !allowed.includes(parameter));

    if (unknown !== undefined) {
      throw new InvalidClinicalCaseDefinitionError(`${field}.${unknown}`);
    }

    if (allowed.length > 0 && present.length === 0) {
      throw new InvalidClinicalCaseDefinitionError(field);
    }

    present.forEach((parameter: EventParameter): void => {
      assertInRange(EVENT_PARAMETER_RANGES[parameter], `${field}.${parameter}`, event[parameter]);
    });

    previousTimeMs = event.simTimeMs;
  });
}

function assertValidTargets(targets: ClinicalCaseTargets): void {
  assertTargetRange("spo2Percent", "targets.spo2Percent", targets.spo2Percent);
  assertTargetRange("paco2MmHg", "targets.paco2MmHg", targets.paco2MmHg);
  assertTargetRange("ph", "targets.ph", targets.ph);
  assertTargetRange("tidalVolumePerKgPbw", "targets.tidalVolumePerKgPbw", targets.tidalVolumePerKgPbw);
  assertInRange("plateauPressureMaxCmH2O", "targets.plateauPressureMaxCmH2O", targets.plateauPressureMaxCmH2O);
  assertInRange("drivingPressureMaxCmH2O", "targets.drivingPressureMaxCmH2O", targets.drivingPressureMaxCmH2O);
  assertInRange("autoPeepMaxCmH2O", "targets.autoPeepMaxCmH2O", targets.autoPeepMaxCmH2O);
}

function assertTargetRange(parameter: PhysiologicalParameter, field: string, range: CaseTargetRange | undefined): void {
  if (!range) {
    return;
  }

  assertInRange(parameter, `${field}.min`, range.min);
  assertInRange(parameter, `${field}.max`, range.max);

  if (range.min > range.max) {
    throw new InvalidClinicalCaseDefinitionError(field);
  }
}

function assertValidRubric(rubric: ClinicalCaseRubric): void {
  if (!ASSISTANCE_POLICY_VALUES.includes(rubric.assistancePolicy)) {
    throw new InvalidClinicalCaseDefinitionError("defaultRubric.assistancePolicy");
  }

  if (!Number.isFinite(rubric.passingScore) || rubric.passingScore < 0 || rubric.passingScore > RUBRIC_TOTAL_WEIGHT) {
    throw new InvalidClinicalCaseDefinitionError("defaultRubric.passingScore");
  }

  if (rubric.criteria.length === 0) {
    throw new InvalidClinicalCaseDefinitionError("defaultRubric.criteria");
  }

  const seenTypes: Set<RubricCriterionTypeValue> = new Set<RubricCriterionTypeValue>();
  let totalWeight: number = 0;

  rubric.criteria.forEach((criterion: RubricCriterion, index: number): void => {
    assertValidCriterion(criterion, `defaultRubric.criteria[${index}]`, seenTypes);

    seenTypes.add(criterion.type);
    totalWeight += criterion.weight;
  });

  if (Math.abs(totalWeight - RUBRIC_TOTAL_WEIGHT) > RUBRIC_WEIGHT_TOLERANCE) {
    throw new InvalidClinicalCaseDefinitionError("defaultRubric.criteria.weight");
  }
}

function assertValidCriterion(criterion: RubricCriterion, field: string, seenTypes: ReadonlySet<RubricCriterionTypeValue>): void {
  if (!RUBRIC_CRITERION_TYPE_VALUES.includes(criterion.type) || seenTypes.has(criterion.type)) {
    throw new InvalidClinicalCaseDefinitionError(`${field}.type`);
  }

  if (!isNonNegative(criterion.weight)) {
    throw new InvalidClinicalCaseDefinitionError(`${field}.weight`);
  }

  if (!isNonNegative(criterion.threshold)) {
    throw new InvalidClinicalCaseDefinitionError(`${field}.threshold`);
  }

  if (criterion.penaltyPoints !== undefined && !isNonNegative(criterion.penaltyPoints)) {
    throw new InvalidClinicalCaseDefinitionError(`${field}.penaltyPoints`);
  }

  const needsWindow: boolean = criterion.type === "TIME_IN_RANGE";
  const hasValidWindow: boolean = criterion.windowMinutes !== undefined && Number.isFinite(criterion.windowMinutes) && criterion.windowMinutes > 0;

  if ((needsWindow && !hasValidWindow) || (criterion.windowMinutes !== undefined && !hasValidWindow)) {
    throw new InvalidClinicalCaseDefinitionError(`${field}.windowMinutes`);
  }
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
