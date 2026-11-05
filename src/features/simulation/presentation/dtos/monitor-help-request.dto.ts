/*
 * Funcionalidad: DTOs de la ayuda del monitor (alarmas y asistencia en modo real)
 * Descripción: Validación de la petición de ayuda de una alarma del simulador y de las peticiones de asistencia y ayuda de alarmas del modo real, que envían la telemetría reciente del equipo (ajustes informados, métricas, alarmas del equipo, límites del cliente, tendencia acotada y caso cargado opcional). La IA nunca envía comandos: solo devuelve sugerencias
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
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { LANGUAGE_VALUES } from "@/common/domain/value-objects/language";
import { MAX_SIMULATION_ASSIST_QUESTION_LENGTH } from "@/features/simulation/presentation/dtos/simulation-assist-request.dto";

export const MAX_REAL_MONITOR_ALARMS: number = 20;
export const MAX_REAL_MONITOR_TREND_POINTS: number = 20;
const ALARM_CODE_PATTERN: RegExp = /^[A-Z][A-Z0-9_]{1,39}$/;
const NUMBER_MESSAGE: string = "simulation.validation.number";

function NumberField(description: string, example: number): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    ApiPropertyOptional({ description, example })(target, propertyKey);
    IsOptional()(target, propertyKey);
    IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage(NUMBER_MESSAGE) })(target, propertyKey);
  };
}

class AlarmCodeField {
  @ApiProperty({ description: "Alarm code (engine or ventilator), e.g. HIGH_PRESSURE, LOW_SPO2", example: "HIGH_PRESSURE" })
  @IsString({ message: i18nValidationMessage("simulation.validation.alarm_code_invalid") })
  @Matches(ALARM_CODE_PATTERN, { message: i18nValidationMessage("simulation.validation.alarm_code_invalid") })
  public alarmCode: string;
}

export class SimulationAlarmHelpDTO extends AlarmCodeField {
  @ApiPropertyOptional({ description: "Answer language; defaults to the request language", enum: LANGUAGE_VALUES, example: "es" })
  @IsOptional()
  @IsIn([...LANGUAGE_VALUES], { message: i18nValidationMessage("simulation.validation.assist_language_invalid") })
  public language?: string;
}

export class RealMonitorSettingsDTO {
  @NumberField("Reported tidal volume (mL)", 450) public tidalVolumeMl?: number;
  @NumberField("Reported respiratory rate (breaths/min)", 16) public respiratoryRateBpm?: number;
  @NumberField("Reported PEEP (cmH2O)", 8) public peepCmH2O?: number;
  @NumberField("Reported FiO2 (fraction)", 0.5) public fio2?: number;
  @NumberField("Reported inspiratory time (s)", 1) public inspiratoryTimeS?: number;
  @NumberField("Reported inspiratory pressure (cmH2O above PEEP)", 15) public inspiratoryPressureCmH2O?: number;
  @NumberField("Reported pressure support (cmH2O)", 10) public pressureSupportCmH2O?: number;
}

export class RealMonitorMetricsDTO {
  @NumberField("Peak pressure of the last breath (cmH2O)", 28) public peakPressureCmH2O?: number;
  @NumberField("Plateau pressure (cmH2O)", 24) public plateauPressureCmH2O?: number;
  @NumberField("Total PEEP (cmH2O)", 9) public totalPeepCmH2O?: number;
  @NumberField("Auto-PEEP (cmH2O)", 1) public autoPeepCmH2O?: number;
  @NumberField("Exhaled tidal volume (mL)", 440) public exhaledTidalVolumeMl?: number;
  @NumberField("Measured respiratory rate (breaths/min)", 16) public measuredRespiratoryRateBpm?: number;
  @NumberField("Minute volume (L/min)", 7) public minuteVolumeLpm?: number;
  @NumberField("SpO2 (%)", 94) public spo2Percent?: number;
  @NumberField("End-tidal CO2 (mmHg)", 38) public etco2MmHg?: number;
}

export class RealMonitorLimitsDTO {
  @NumberField("Client high pressure limit (cmH2O)", 40) public highPressureCmH2O?: number;
  @NumberField("Client low exhaled volume limit (mL)", 200) public lowTidalVolumeMl?: number;
  @NumberField("Client high exhaled volume limit (mL)", 800) public highTidalVolumeMl?: number;
  @NumberField("Client high respiratory rate limit (breaths/min)", 35) public highRespiratoryRateBpm?: number;
}

export class RealMonitorTrendPointDTO {
  @ApiProperty({ description: "Seconds before now (0 = latest)", example: 30 })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public secondsAgo: number;

  @NumberField("Peak pressure (cmH2O)", 28) public peakPressureCmH2O?: number;
  @NumberField("Exhaled tidal volume (mL)", 440) public exhaledTidalVolumeMl?: number;
  @NumberField("Respiratory rate (breaths/min)", 16) public respiratoryRateBpm?: number;
  @NumberField("SpO2 (%)", 94) public spo2Percent?: number;
}

export class RealMonitorStateDTO {
  @ApiPropertyOptional({ description: "Reported ventilation mode", example: "VCV", maxLength: 20 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @MaxLength(20, { message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  public mode?: string;

  @ApiPropertyOptional({ type: RealMonitorSettingsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => RealMonitorSettingsDTO)
  public settings?: RealMonitorSettingsDTO;

  @ApiPropertyOptional({ type: RealMonitorMetricsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => RealMonitorMetricsDTO)
  public metrics?: RealMonitorMetricsDTO;

  @ApiPropertyOptional({ description: "Active alarm codes of the ventilator and the client limits", example: ["HIGH_PRESSURE"], type: String, isArray: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @ArrayMaxSize(MAX_REAL_MONITOR_ALARMS, { message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @Matches(ALARM_CODE_PATTERN, { each: true, message: i18nValidationMessage("simulation.validation.alarm_code_invalid") })
  public alarms?: string[];

  @ApiPropertyOptional({ type: RealMonitorLimitsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => RealMonitorLimitsDTO)
  public limits?: RealMonitorLimitsDTO;

  @ApiPropertyOptional({ description: "Recent window, newest last", type: RealMonitorTrendPointDTO, isArray: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @ArrayMaxSize(MAX_REAL_MONITOR_TREND_POINTS, { message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @ValidateNested({ each: true })
  @Type(() => RealMonitorTrendPointDTO)
  public trend?: RealMonitorTrendPointDTO[];

  @ApiPropertyOptional({ description: "Clinical case loaded on the monitor, if any", example: "engine-ards-obese", maxLength: 100 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  @MaxLength(100, { message: i18nValidationMessage("simulation.validation.monitor_state_invalid") })
  public caseId?: string;
}

export class RealAssistDTO {
  @ApiProperty({ type: RealMonitorStateDTO })
  @ValidateNested()
  @Type(() => RealMonitorStateDTO)
  public state: RealMonitorStateDTO;

  @ApiPropertyOptional({ description: "User question", example: "¿Qué reviso primero?", maxLength: MAX_SIMULATION_ASSIST_QUESTION_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("simulation.validation.assist_question_string") })
  @MaxLength(MAX_SIMULATION_ASSIST_QUESTION_LENGTH, { message: i18nValidationMessage("simulation.validation.assist_question_too_long") })
  public question?: string;

  @ApiPropertyOptional({ description: "Answer language; defaults to the request language", enum: LANGUAGE_VALUES, example: "es" })
  @IsOptional()
  @IsIn([...LANGUAGE_VALUES], { message: i18nValidationMessage("simulation.validation.assist_language_invalid") })
  public language?: string;
}

export class RealAlarmHelpDTO extends SimulationAlarmHelpDTO {
  @ApiProperty({ type: RealMonitorStateDTO })
  @ValidateNested()
  @Type(() => RealMonitorStateDTO)
  public state: RealMonitorStateDTO;
}
