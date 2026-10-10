/*
 * Funcionalidad: DTOs de gestión de casos clínicos
 * Descripción: Valida la forma (tipos, enumerados, anidamiento) del contenido y la definición simulable de un caso clínico al crearlo o reemplazarlo, y el cambio de estado; los rangos fisiológicos los valida el dominio (422)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CASE_DIFFICULTY_VALUES } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import {
  ASSISTANCE_POLICY_VALUES,
  CASE_EVENT_TYPE_VALUES,
  CASE_FLOW_PATTERN_VALUES,
  CASE_MANDATORY_BREATH_TYPE_VALUES,
  CASE_TRIGGER_TYPE_VALUES,
  CASE_VENTILATION_MODE_VALUES,
  PATIENT_SEX_VALUES,
  RUBRIC_CRITERION_TYPE_VALUES,
} from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";
import { CLINICAL_CASE_STATUS_VALUES } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { PATHOLOGY_VALUES } from "@/features/clinical-cases/domain/value-objects/pathology";

const FINITE_NUMBER: { allowNaN: boolean; allowInfinity: boolean } = { allowNaN: false, allowInfinity: false };
const NUMBER_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("clinical-cases.validation.number_invalid") };
const ENUM_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("common.validation.enum") };
const STRING_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("common.validation.string") };
const REQUIRED_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("clinical-cases.validation.text_required") };
const OBJECT_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("clinical-cases.validation.object_required") };
const ARRAY_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("clinical-cases.validation.array_required") };

export class ClinicalCaseHistoryDTO {
  @ApiProperty({ description: "History of the present illness", example: "Progressive dyspnea for 3 days" })
  @IsString(STRING_MESSAGE)
  public presentIllness: string;

  @ApiProperty({ description: "Relevant past history items", example: ["Hypertension"], type: String, isArray: true })
  @IsArray(ARRAY_MESSAGE)
  @IsString({ ...STRING_MESSAGE, each: true })
  public relevantHistory: string[];
}

export class RecruitmentCurvePointDTO {
  @ApiProperty({ description: "PEEP in cmH2O", example: 10 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public peepCmH2O: number;

  @ApiProperty({ description: "Shunt fraction at that PEEP (0-1)", example: 0.2 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public shuntFraction: number;
}

export class PatientEffortDTO {
  @ApiProperty({ description: "Muscle pressure amplitude in cmH2O (0 = no effort)", example: 0 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public amplitudeCmH2O: number;

  @ApiProperty({ description: "Spontaneous effort rate in breaths/min", example: 0 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public rateBpm: number;

  @ApiProperty({ description: "Inspiratory fraction of the effort cycle (Ti/Ttot)", example: 0.35 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public inspiratoryFraction: number;
}

export class HemodynamicEffectDTO {
  @ApiProperty({ description: "Baseline mean arterial pressure in mmHg", example: 85 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public baselineMapMmHg: number;

  @ApiProperty({ description: "Mean airway pressure above which MAP falls, in cmH2O", example: 15 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public meanAirwayPressureThresholdCmH2O: number;

  @ApiProperty({ description: "MAP drop per cmH2O above the threshold, in mmHg", example: 1 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public mapDropPerCmH2O: number;
}

export class GasTimeConstantsDTO {
  @ApiProperty({ description: "PaCO2 time constant in minutes", example: 3 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public paco2TimeConstantMin: number;

  @ApiProperty({ description: "Oxygenation time constant in seconds", example: 30 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public oxygenTimeConstantS: number;
}

export class DeteriorationDTO {
  @ApiProperty({ description: "Deterioration rate as a fraction of the maximum per minute", example: 0 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public ratePerMin: number;

  @ApiProperty({ description: "Maximum fraction of compliance lost", example: 0.3 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public maxComplianceLossFraction: number;

  @ApiProperty({ description: "Maximum shunt fraction added", example: 0.1 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public maxShuntIncrease: number;
}

export class ClinicalCaseMechanicsDTO {
  @ApiProperty({ description: "Static respiratory-system compliance in mL/cmH2O", example: 50 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public complianceMlPerCmH2O: number;

  @ApiProperty({ description: "Airway resistance in cmH2O/L/s", example: 10 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public resistanceCmH2OPerLps: number;

  @ApiProperty({ description: "Dead space in mL", example: 150 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public deadSpaceMl: number;

  @ApiProperty({ description: "CO2 production in mL/min", example: 200 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public vco2MlPerMin: number;

  @ApiProperty({ description: "Plasma bicarbonate in mmol/L", example: 24 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public bicarbonateMmolPerL: number;

  @ApiProperty({ description: "Hemoglobin in g/dL", example: 14 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public hemoglobinGPerDl: number;

  @ApiProperty({ description: "Arteriovenous O2 content difference in mL/dL", example: 5 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public arteriovenousO2DifferenceMlPerDl: number;

  @ApiProperty({ description: "Basal shunt fraction (0-1)", example: 0.05 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public basalShuntFraction: number;

  @ApiProperty({ description: "Shunt fraction by PEEP, ascending PEEP", type: RecruitmentCurvePointDTO, isArray: true })
  @IsArray(ARRAY_MESSAGE)
  @ValidateNested({ each: true })
  @Type(() => RecruitmentCurvePointDTO)
  public recruitmentCurve: RecruitmentCurvePointDTO[];

  @ApiProperty({ description: "Spontaneous muscle effort", type: PatientEffortDTO })
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => PatientEffortDTO)
  public patientEffort: PatientEffortDTO;

  @ApiProperty({ description: "Hemodynamic effect of intrathoracic pressure", type: HemodynamicEffectDTO })
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => HemodynamicEffectDTO)
  public hemodynamics: HemodynamicEffectDTO;

  @ApiProperty({ description: "Gas exchange time constants", type: GasTimeConstantsDTO })
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => GasTimeConstantsDTO)
  public gasTimeConstants: GasTimeConstantsDTO;

  @ApiProperty({ description: "Progressive deterioration", type: DeteriorationDTO })
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => DeteriorationDTO)
  public deterioration: DeteriorationDTO;
}

export class ClinicalCaseVentilatorSettingsDTO {
  @ApiProperty({ description: "Ventilation mode", enum: CASE_VENTILATION_MODE_VALUES, example: "VCV" })
  @IsIn([...CASE_VENTILATION_MODE_VALUES], ENUM_MESSAGE)
  public mode: string;

  @ApiPropertyOptional({ description: "Tidal volume in mL", example: 450 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public tidalVolumeMl?: number;

  @ApiPropertyOptional({ description: "Respiratory rate in breaths/min", example: 14 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public respiratoryRateBpm?: number;

  @ApiPropertyOptional({ description: "PEEP in cmH2O", example: 5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public peepCmH2O?: number;

  @ApiPropertyOptional({ description: "FiO2 as a fraction (0.21-1)", example: 0.4 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public fio2?: number;

  @ApiPropertyOptional({ description: "Inspiratory time in seconds", example: 1 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public inspiratoryTimeS?: number;

  @ApiPropertyOptional({ description: "Inspiratory flow pattern", enum: CASE_FLOW_PATTERN_VALUES, example: "SQUARE" })
  @IsOptional()
  @IsIn([...CASE_FLOW_PATTERN_VALUES], ENUM_MESSAGE)
  public flowPattern?: string;

  @ApiPropertyOptional({ description: "Inspiratory pause in seconds", example: 0 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public inspiratoryPauseS?: number;

  @ApiPropertyOptional({ description: "Inspiratory pressure above PEEP in cmH2O", example: 15 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public inspiratoryPressureCmH2O?: number;

  @ApiPropertyOptional({ description: "Pressure support above PEEP in cmH2O", example: 10 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public pressureSupportCmH2O?: number;

  @ApiPropertyOptional({ description: "Trigger type", enum: CASE_TRIGGER_TYPE_VALUES, example: "FLOW" })
  @IsOptional()
  @IsIn([...CASE_TRIGGER_TYPE_VALUES], ENUM_MESSAGE)
  public triggerType?: string;

  @ApiPropertyOptional({ description: "Flow trigger in L/min", example: 2 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public flowTriggerLpm?: number;

  @ApiPropertyOptional({ description: "Pressure trigger in cmH2O", example: 2 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public pressureTriggerCmH2O?: number;

  @ApiPropertyOptional({ description: "Expiratory cycling as % of peak flow", example: 25 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public cycleOffPercent?: number;

  @ApiPropertyOptional({ description: "Apnea time in seconds", example: 20 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public apneaTimeS?: number;

  @ApiPropertyOptional({ description: "Mandatory breath type in SIMV", enum: CASE_MANDATORY_BREATH_TYPE_VALUES, example: "VCV" })
  @IsOptional()
  @IsIn([...CASE_MANDATORY_BREATH_TYPE_VALUES], ENUM_MESSAGE)
  public simvMandatoryType?: string;
}

export class ClinicalCaseInitialStateDTO {
  @ApiProperty({ description: "Initial PaCO2 in mmHg", example: 40 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public paco2MmHg: number;

  @ApiProperty({ description: "Initial PaO2 in mmHg", example: 90 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public pao2MmHg: number;
}

export class ClinicalCaseEventDTO {
  @ApiProperty({ description: "Simulated time of the event in ms (non-decreasing)", example: 300000 })
  @IsInt({ message: i18nValidationMessage("clinical-cases.validation.integer_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.min_zero") })
  public simTimeMs: number;

  @ApiProperty({ description: "Event type", enum: CASE_EVENT_TYPE_VALUES, example: "BRONCHOSPASM" })
  @IsIn([...CASE_EVENT_TYPE_VALUES], ENUM_MESSAGE)
  public type: string;

  @ApiPropertyOptional({ description: "Resistance multiplier (BRONCHOSPASM, SECRETIONS)", example: 2 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public resistanceFactor?: number;

  @ApiPropertyOptional({ description: "Compliance multiplier (DERECRUITMENT)", example: 0.7 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public complianceFactor?: number;

  @ApiPropertyOptional({ description: "Shunt fraction added (DERECRUITMENT)", example: 0.1 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public shuntIncrease?: number;

  @ApiPropertyOptional({ description: "New effort amplitude in cmH2O (EFFORT_CHANGE)", example: 8 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public effortAmplitudeCmH2O?: number;

  @ApiPropertyOptional({ description: "New effort rate in breaths/min (EFFORT_CHANGE)", example: 24 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public effortRateBpm?: number;
}

export class CaseTargetRangeDTO {
  @ApiProperty({ description: "Lower bound", example: 88 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public min: number;

  @ApiProperty({ description: "Upper bound", example: 95 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public max: number;
}

export class ClinicalCaseTargetsDTO {
  @ApiPropertyOptional({ description: "SpO2 target in %", type: CaseTargetRangeDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => CaseTargetRangeDTO)
  public spo2Percent?: CaseTargetRangeDTO;

  @ApiPropertyOptional({ description: "PaCO2 target in mmHg", type: CaseTargetRangeDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => CaseTargetRangeDTO)
  public paco2MmHg?: CaseTargetRangeDTO;

  @ApiPropertyOptional({ description: "Arterial pH target", type: CaseTargetRangeDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => CaseTargetRangeDTO)
  public ph?: CaseTargetRangeDTO;

  @ApiPropertyOptional({ description: "Maximum plateau pressure in cmH2O", example: 30 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public plateauPressureMaxCmH2O?: number;

  @ApiPropertyOptional({ description: "Maximum driving pressure in cmH2O", example: 15 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public drivingPressureMaxCmH2O?: number;

  @ApiPropertyOptional({ description: "Tidal volume target in mL/kg of predicted body weight", type: CaseTargetRangeDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => CaseTargetRangeDTO)
  public tidalVolumePerKgPbw?: CaseTargetRangeDTO;

  @ApiPropertyOptional({ description: "Maximum auto-PEEP in cmH2O", example: 5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public autoPeepMaxCmH2O?: number;
}

export class RubricCriterionDTO {
  @ApiProperty({ description: "Criterion type", enum: RUBRIC_CRITERION_TYPE_VALUES, example: "TARGETS_REACHED" })
  @IsIn([...RUBRIC_CRITERION_TYPE_VALUES], ENUM_MESSAGE)
  public type: string;

  @ApiProperty({ description: "Points of the criterion; weights add up to 100", example: 40 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.min_zero") })
  public weight: number;

  @ApiProperty({ description: "Criterion threshold in the unit of its type", example: 0.8 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.min_zero") })
  public threshold: number;

  @ApiPropertyOptional({ description: "Evaluation window in minutes (TIME_IN_RANGE)", example: 5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public windowMinutes?: number;

  @ApiPropertyOptional({ description: "Points subtracted per violation or use", example: 5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.min_zero") })
  public penaltyPoints?: number;
}

export class ClinicalCaseRubricDTO {
  @ApiProperty({ description: "AI assistance policy", enum: ASSISTANCE_POLICY_VALUES, example: "DISABLED" })
  @IsIn([...ASSISTANCE_POLICY_VALUES], ENUM_MESSAGE)
  public assistancePolicy: string;

  @ApiProperty({ description: "Minimum score to pass (0-100)", example: 70 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public passingScore: number;

  @ApiProperty({ description: "Rubric criteria", type: RubricCriterionDTO, isArray: true })
  @IsArray(ARRAY_MESSAGE)
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDTO)
  public criteria: RubricCriterionDTO[];
}

export class UpsertClinicalCaseDTO {
  @ApiProperty({ description: "Case title", example: "ARDS in an obese patient" })
  @IsString(STRING_MESSAGE)
  @IsNotEmpty(REQUIRED_MESSAGE)
  public title: string;

  @ApiProperty({ description: "Case description", example: "A 52-year-old patient with pneumonia-related ARDS" })
  @IsString(STRING_MESSAGE)
  @IsNotEmpty(REQUIRED_MESSAGE)
  public description: string;

  @ApiPropertyOptional({ description: "Short summary shown in listings", example: "Moderate ARDS, BMI 40" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public summary?: string;

  @ApiPropertyOptional({ description: "Clinical history", type: ClinicalCaseHistoryDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseHistoryDTO)
  public history?: ClinicalCaseHistoryDTO;

  @ApiProperty({ description: "Patient age in years", example: 52 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public patientAge: number;

  @ApiProperty({ description: "Patient weight in kg", example: 120 })
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public patientWeight: number;

  @ApiPropertyOptional({ description: "Patient sex (needed for predicted body weight)", enum: PATIENT_SEX_VALUES, example: "FEMALE" })
  @IsOptional()
  @IsIn([...PATIENT_SEX_VALUES], ENUM_MESSAGE)
  public patientSex?: string;

  @ApiPropertyOptional({ description: "Patient height in cm (needed for predicted body weight)", example: 165 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, NUMBER_MESSAGE)
  public patientHeightCm?: number;

  @ApiProperty({ description: "Main diagnosis", example: "SDRA moderado" })
  @IsString(STRING_MESSAGE)
  @IsNotEmpty(REQUIRED_MESSAGE)
  public mainDiagnosis: string;

  @ApiProperty({ description: "Comorbidities", example: ["Obesidad"], type: String, isArray: true })
  @IsArray(ARRAY_MESSAGE)
  @IsString({ ...STRING_MESSAGE, each: true })
  public comorbidities: string[];

  @ApiPropertyOptional({ description: "Laboratory data (free JSON object)", example: { ph: 7.3 }, type: Object })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  public labData?: Record<string, unknown>;

  @ApiProperty({ description: "Difficulty", enum: CASE_DIFFICULTY_VALUES, example: "INTERMEDIATE" })
  @IsIn([...CASE_DIFFICULTY_VALUES], { message: i18nValidationMessage("clinical-cases.validation.difficulty_invalid") })
  public difficulty: string;

  @ApiProperty({ description: "Pathology", enum: PATHOLOGY_VALUES, example: "SDRA" })
  @IsIn([...PATHOLOGY_VALUES], { message: i18nValidationMessage("clinical-cases.validation.pathology_invalid") })
  public pathology: string;

  @ApiProperty({ description: "Educational goal", example: "Apply protective ventilation by predicted body weight" })
  @IsString(STRING_MESSAGE)
  @IsNotEmpty(REQUIRED_MESSAGE)
  public educationalGoal: string;

  @ApiPropertyOptional({ description: "Respiratory mechanics and physiology", type: ClinicalCaseMechanicsDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseMechanicsDTO)
  public mechanics?: ClinicalCaseMechanicsDTO;

  @ApiPropertyOptional({ description: "Initial ventilator settings", type: ClinicalCaseVentilatorSettingsDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseVentilatorSettingsDTO)
  public initialVentilatorSettings?: ClinicalCaseVentilatorSettingsDTO;

  @ApiPropertyOptional({ description: "Initial blood gases", type: ClinicalCaseInitialStateDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseInitialStateDTO)
  public initialState?: ClinicalCaseInitialStateDTO;

  @ApiPropertyOptional({ description: "Scheduled events, in non-decreasing time order", type: ClinicalCaseEventDTO, isArray: true })
  @IsOptional()
  @IsArray(ARRAY_MESSAGE)
  @ValidateNested({ each: true })
  @Type(() => ClinicalCaseEventDTO)
  public events?: ClinicalCaseEventDTO[];

  @ApiPropertyOptional({ description: "Clinical targets", type: ClinicalCaseTargetsDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseTargetsDTO)
  public targets?: ClinicalCaseTargetsDTO;

  @ApiPropertyOptional({ description: "Default scoring rubric", type: ClinicalCaseRubricDTO })
  @IsOptional()
  @IsObject(OBJECT_MESSAGE)
  @ValidateNested()
  @Type(() => ClinicalCaseRubricDTO)
  public defaultRubric?: ClinicalCaseRubricDTO;
}

export class ChangeClinicalCaseStatusDTO {
  @ApiProperty({ description: "New status", enum: CLINICAL_CASE_STATUS_VALUES, example: "PUBLISHED" })
  @IsIn([...CLINICAL_CASE_STATUS_VALUES], { message: i18nValidationMessage("clinical-cases.validation.status_invalid") })
  public status: string;
}
