/*
 * Funcionalidad: DTOs de solicitud de sesiones de simulación
 * Descripción: Validación de entrada de las sesiones con eventos: inicio (modo, caso, intento y pregunta de examen, multiplicador y paciente propio con sus signos vitales, en los rangos del formulario de julio y del motor), lote de eventos (id del cliente, tiempo simulado, tipo y payload), fin con tiempo simulado opcional, filtros del listado y prueba de caso clínico (segundos y semilla)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import {
  PATIENT_BREATHING_PATTERN_VALUES,
  PATIENT_CONDITION_VALUES,
  PATIENT_DIFFICULTY_VALUES,
} from "@/features/simulation/domain/patient/simulated-patient";
import {
  CLIENT_SIMULATION_EVENT_TYPE_VALUES,
  SIMULATION_MODE_VALUES,
  SIMULATION_SESSION_STATUS_VALUES,
  TIME_MULTIPLIER_VALUES,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export const MAX_EVENTS_PER_REQUEST: number = 1000;
export const MAX_SIM_TIME_MS: number = 2147483647;
export const MAX_SEED: number = 2147483646;
export const MIN_TEST_RUN_SECONDS: number = 1;
export const MAX_TEST_RUN_SECONDS: number = 1800;
export const DEFAULT_TEST_RUN_SECONDS: number = 300;

const STRING_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("common.validation.string") };
const SIM_TIME_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = {
  message: i18nValidationMessage("simulation.validation.sim_time_ms_invalid"),
};

const NUMBER_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("simulation.validation.number") };
const RANGE_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("simulation.validation.patient_value_out_of_range") };
const ENUM_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("common.validation.enum") };
const ARRAY_MESSAGE: { message: ReturnType<typeof i18nValidationMessage> } = { message: i18nValidationMessage("simulation.validation.array") };
const PATIENT_SEX_VALUES: readonly string[] = ["MALE", "FEMALE"];
const MAX_PATIENT_LIST_ITEMS: number = 20;
const MAX_PATIENT_TEXT_LENGTH: number = 200;
const MAX_PATIENT_NAME_LENGTH: number = 100;
const MAX_DIAGNOSIS_LENGTH: number = 500;

export class SimulatedPatientVitalsDTO {
  @ApiPropertyOptional({ description: "Heart rate (beats/min); shown only", example: 105, minimum: 30, maximum: 200 })
  @IsOptional()
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(30, RANGE_MESSAGE)
  @Max(200, RANGE_MESSAGE)
  public heartRateBpm?: number;

  @ApiProperty({ description: "Respiratory rate (breaths/min); initial ventilator rate, limited to 5-40", example: 24, minimum: 5, maximum: 50 })
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(5, RANGE_MESSAGE)
  @Max(50, RANGE_MESSAGE)
  public respiratoryRateBpm: number;

  @ApiProperty({ description: "SpO2 (%); sets the initial PaO2 through the inverse Severinghaus equation", example: 88, minimum: 50, maximum: 100 })
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(50, RANGE_MESSAGE)
  @Max(100, RANGE_MESSAGE)
  public spo2Percent: number;

  @ApiPropertyOptional({ description: "Body temperature (°C); shown only", example: 38.2, minimum: 34, maximum: 42 })
  @IsOptional()
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(34, RANGE_MESSAGE)
  @Max(42, RANGE_MESSAGE)
  public temperatureC?: number;

  @ApiPropertyOptional({ description: "Systolic pressure (mmHg); with the diastolic sets the baseline MAP (50-120)", example: 140, minimum: 50, maximum: 250 })
  @IsOptional()
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(50, RANGE_MESSAGE)
  @Max(250, RANGE_MESSAGE)
  public systolicMmHg?: number;

  @ApiPropertyOptional({ description: "Diastolic pressure (mmHg)", example: 85, minimum: 20, maximum: 150 })
  @IsOptional()
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(20, RANGE_MESSAGE)
  @Max(150, RANGE_MESSAGE)
  public diastolicMmHg?: number;

  @ApiPropertyOptional({ description: "Glasgow coma scale; shown only", example: 14, minimum: 3, maximum: 15 })
  @IsOptional()
  @IsInt(NUMBER_MESSAGE)
  @Min(3, RANGE_MESSAGE)
  @Max(15, RANGE_MESSAGE)
  public glasgow?: number;

  @ApiPropertyOptional({ description: "Breathing pattern; shown only", enum: PATIENT_BREATHING_PATTERN_VALUES, example: "tachypneic" })
  @IsOptional()
  @IsIn([...PATIENT_BREATHING_PATTERN_VALUES], ENUM_MESSAGE)
  public breathingPattern?: string;
}

export class SimulatedPatientDTO {
  @ApiPropertyOptional({ description: "Name shown in the session (optional)", example: "María José", maxLength: MAX_PATIENT_NAME_LENGTH })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  @MaxLength(MAX_PATIENT_NAME_LENGTH, RANGE_MESSAGE)
  public displayName?: string;

  @ApiProperty({ description: "Age (years); above 60 lowers the compliance by 0.5 mL/cmH2O per year", example: 60, minimum: 18, maximum: 100 })
  @IsInt(NUMBER_MESSAGE)
  @Min(18, RANGE_MESSAGE)
  @Max(100, RANGE_MESSAGE)
  public ageYears: number;

  @ApiProperty({ description: "Sex", enum: PATIENT_SEX_VALUES, example: "MALE" })
  @IsIn([...PATIENT_SEX_VALUES], ENUM_MESSAGE)
  public sex: string;

  @ApiProperty({ description: "Actual weight (kg); a BMI above 30 lowers the compliance by 1 % per point", example: 70, minimum: 30, maximum: 250 })
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(30, RANGE_MESSAGE)
  @Max(250, RANGE_MESSAGE)
  public weightKg: number;

  @ApiProperty({ description: "Height (cm), range of the engine", example: 175, minimum: 140, maximum: 215 })
  @IsNumber({}, NUMBER_MESSAGE)
  @Min(140, RANGE_MESSAGE)
  @Max(215, RANGE_MESSAGE)
  public heightCm: number;

  @ApiProperty({ description: "Main condition: sets compliance and resistance and, without caseId, the base case", enum: PATIENT_CONDITION_VALUES, example: "PNEUMONIA" })
  @IsIn([...PATIENT_CONDITION_VALUES], ENUM_MESSAGE)
  public condition: string;

  @ApiProperty({ description: "Difficulty; a label only, it does not change the simulation", enum: PATIENT_DIFFICULTY_VALUES, example: "INTERMEDIATE" })
  @IsIn([...PATIENT_DIFFICULTY_VALUES], ENUM_MESSAGE)
  public difficulty: string;

  @ApiPropertyOptional({ description: "Diagnosis; shown only", example: "Neumonía grave con hipoxemia", maxLength: MAX_DIAGNOSIS_LENGTH })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  @MaxLength(MAX_DIAGNOSIS_LENGTH, RANGE_MESSAGE)
  public diagnosis?: string;

  @ApiPropertyOptional({ description: "Allergies; shown only", example: ["Penicilina"], type: [String], maxItems: MAX_PATIENT_LIST_ITEMS })
  @IsOptional()
  @IsArray(ARRAY_MESSAGE)
  @ArrayMaxSize(MAX_PATIENT_LIST_ITEMS, RANGE_MESSAGE)
  @IsString({ each: true, ...STRING_MESSAGE })
  @MaxLength(MAX_PATIENT_TEXT_LENGTH, { each: true, ...RANGE_MESSAGE })
  public allergies?: string[];

  @ApiPropertyOptional({ description: "Relevant medical history; shown only", example: ["Hipertensión arterial"], type: [String], maxItems: MAX_PATIENT_LIST_ITEMS })
  @IsOptional()
  @IsArray(ARRAY_MESSAGE)
  @ArrayMaxSize(MAX_PATIENT_LIST_ITEMS, RANGE_MESSAGE)
  @IsString({ each: true, ...STRING_MESSAGE })
  @MaxLength(MAX_PATIENT_TEXT_LENGTH, { each: true, ...RANGE_MESSAGE })
  public history?: string[];

  @ApiProperty({ description: "Vital signs at the start", type: SimulatedPatientVitalsDTO })
  @IsObject({ message: i18nValidationMessage("simulation.validation.payload_object") })
  @ValidateNested()
  @Type(() => SimulatedPatientVitalsDTO)
  public vitals: SimulatedPatientVitalsDTO;
}

export class StartSimulationSessionDTO {
  @ApiProperty({ description: "Simulation mode", enum: SIMULATION_MODE_VALUES, example: "FREE" })
  @IsIn([...SIMULATION_MODE_VALUES], { message: i18nValidationMessage("simulation.validation.mode_invalid") })
  public mode: string;

  @ApiPropertyOptional({ description: "Clinical case ID (FREE mode only; ignored in EXAM mode)", example: "engine-normal-lung" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public caseId?: string;

  @ApiPropertyOptional({ description: "Exam attempt ID (EXAM mode)", example: "cm1attempt0001" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public attemptId?: string;

  @ApiPropertyOptional({ description: "Exam question ID of type SIMULATION (EXAM mode)", example: "cm1question0001" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public questionId?: string;

  @ApiPropertyOptional({ description: "Slow dynamics time multiplier", enum: TIME_MULTIPLIER_VALUES, example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsIn([...TIME_MULTIPLIER_VALUES], { message: i18nValidationMessage("simulation.validation.time_multiplier_invalid") })
  public timeMultiplier?: number;

  @ApiPropertyOptional({
    description: "Own patient (FREE mode only; ignored in EXAM mode). Without caseId the server picks the published base case of its condition; its overrides are stored in the session",
    type: SimulatedPatientDTO,
  })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("simulation.validation.payload_object") })
  @ValidateNested()
  @Type(() => SimulatedPatientDTO)
  public patient?: SimulatedPatientDTO;
}

export class SimulationEventInputDTO {
  @ApiProperty({ description: "Client-generated event ID (idempotency key)", example: "0192f1c2-7c1e-7a8b-9c0d-1e2f3a4b5c6d", maxLength: 64 })
  @IsString({ message: i18nValidationMessage("simulation.validation.event_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("simulation.validation.event_id_required") })
  @MaxLength(64, { message: i18nValidationMessage("simulation.validation.event_id_required") })
  public id: string;

  @ApiProperty({ description: "Simulated time of the event in ms", example: 12000, minimum: 0 })
  @Type(() => Number)
  @IsInt(SIM_TIME_MESSAGE)
  @Min(0, SIM_TIME_MESSAGE)
  @Max(MAX_SIM_TIME_MS, SIM_TIME_MESSAGE)
  public simTimeMs: number;

  @ApiProperty({ description: "Event type", enum: CLIENT_SIMULATION_EVENT_TYPE_VALUES, example: "PARAM_CHANGE" })
  @IsIn([...CLIENT_SIMULATION_EVENT_TYPE_VALUES], { message: i18nValidationMessage("simulation.validation.event_type_invalid") })
  public type: string;

  @ApiProperty({
    description: "PARAM_CHANGE: { changes: Partial<VentilatorSettings> }; ALARM_ACK: { alarmCode }. Unknown fields (scores, metrics) are discarded",
    example: { changes: { peepCmH2O: 8, fio2: 0.5 } },
    type: Object,
  })
  @IsObject({ message: i18nValidationMessage("simulation.validation.payload_object") })
  public payload: Record<string, unknown>;
}

export class AppendSimulationEventsDTO {
  @ApiProperty({ description: "Events in client order", type: SimulationEventInputDTO, isArray: true })
  @IsArray({ message: i18nValidationMessage("simulation.validation.events_array") })
  @ArrayMinSize(1, { message: i18nValidationMessage("simulation.validation.events_array") })
  @ArrayMaxSize(MAX_EVENTS_PER_REQUEST, { message: i18nValidationMessage("simulation.validation.events_array") })
  @ValidateNested({ each: true })
  @Type(() => SimulationEventInputDTO)
  public events: SimulationEventInputDTO[];
}

export class EndSimulationSessionDTO {
  @ApiPropertyOptional({ description: "Final simulated time in ms; defaults to the last accepted event", example: 600000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt(SIM_TIME_MESSAGE)
  @Min(0, SIM_TIME_MESSAGE)
  @Max(MAX_SIM_TIME_MS, SIM_TIME_MESSAGE)
  public simTimeMs?: number;
}

export class GetSimulationSessionsQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Student whose sessions to list; defaults to the caller", example: "cm1student0001" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public userId?: string;

  @ApiPropertyOptional({ description: "Filter by clinical case ID", example: "engine-normal-lung" })
  @IsOptional()
  @IsString(STRING_MESSAGE)
  public caseId?: string;

  @ApiPropertyOptional({ description: "Filter by mode", enum: SIMULATION_MODE_VALUES, example: "FREE" })
  @IsOptional()
  @IsIn([...SIMULATION_MODE_VALUES], { message: i18nValidationMessage("simulation.validation.mode_invalid") })
  public mode?: string;

  @ApiPropertyOptional({ description: "Filter by status", enum: SIMULATION_SESSION_STATUS_VALUES, example: "ENDED" })
  @IsOptional()
  @IsIn([...SIMULATION_SESSION_STATUS_VALUES], { message: i18nValidationMessage("common.validation.enum") })
  public status?: string;
}

export class ClinicalCaseTestRunRequestDTO {
  @ApiPropertyOptional({
    description: "Simulated seconds to run without intervention",
    example: DEFAULT_TEST_RUN_SECONDS,
    minimum: MIN_TEST_RUN_SECONDS,
    maximum: MAX_TEST_RUN_SECONDS,
    default: DEFAULT_TEST_RUN_SECONDS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("simulation.validation.seconds_invalid") })
  @Min(MIN_TEST_RUN_SECONDS, { message: i18nValidationMessage("simulation.validation.seconds_invalid") })
  @Max(MAX_TEST_RUN_SECONDS, { message: i18nValidationMessage("simulation.validation.seconds_invalid") })
  public seconds?: number;

  @ApiPropertyOptional({ description: "Engine seed; generated by the server when omitted", example: 42, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("simulation.validation.seed_invalid") })
  @Min(0, { message: i18nValidationMessage("simulation.validation.seed_invalid") })
  @Max(MAX_SEED, { message: i18nValidationMessage("simulation.validation.seed_invalid") })
  public seed?: number;
}
