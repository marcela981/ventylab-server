/*
 * Funcionalidad: DTOs de solicitud de sesiones de simulación
 * Descripción: Validación de entrada de las sesiones con eventos: inicio (modo, caso, intento y pregunta de examen, multiplicador), lote de eventos (id del cliente, tiempo simulado, tipo y payload), fin con tiempo simulado opcional, filtros del listado y prueba de caso clínico (segundos y semilla)
 * Versión: 1.0
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
