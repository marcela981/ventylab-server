/*
 * Funcionalidad: DTO del contexto de consola de la ayuda de IA del simulador
 * Descripción: Campos que la consola agrega a "Asesoría IA" y "¿Cómo estabilizar?" de una sesión: el tiempo simulado actual (el servidor lo valida contra el último evento, la cota del reloj y la fecha límite y repite la sesión hasta él), si quedaron cambios sin enviar (el vaciado acotado de la cola venció) y una foto de lo que muestra (signos, gases, gravedad, ajustes y alarmas con su prioridad), que el servidor solo compara con su repetición: la IA siempre recibe el estado del servidor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { type ClientAssistSnapshot } from "@/features/simulation/domain/assist/assist-context-check";

export const MAX_CLIENT_SNAPSHOT_ALARMS: number = 20;
const ALARM_CODE_PATTERN: RegExp = /^[A-Z][A-Z0-9_]{1,39}$/;
const INVALID_MESSAGE: string = "simulation.validation.help_context_invalid";
const ALARM_PRIORITY_VALUES: readonly string[] = ["HIGH", "MEDIUM", "LOW"];

function SnapshotNumber(description: string, example: number): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    ApiPropertyOptional({ description, example })(target, propertyKey);
    IsOptional()(target, propertyKey);
    IsNumber({ allowNaN: false, allowInfinity: false }, { message: i18nValidationMessage(INVALID_MESSAGE) })(target, propertyKey);
  };
}

export class ClientSnapshotAlarmDTO {
  @ApiPropertyOptional({ description: "Active alarm code", example: "LOW_SPO2" })
  @IsString({ message: i18nValidationMessage(INVALID_MESSAGE) })
  @Matches(ALARM_CODE_PATTERN, { message: i18nValidationMessage(INVALID_MESSAGE) })
  public code: string;

  @ApiPropertyOptional({ description: "Alarm priority shown by the console", enum: ALARM_PRIORITY_VALUES, example: "HIGH" })
  @IsOptional()
  @IsIn([...ALARM_PRIORITY_VALUES], { message: i18nValidationMessage(INVALID_MESSAGE) })
  public severity?: string;
}

export class ClientSnapshotSettingsDTO {
  @ApiPropertyOptional({ description: "Applied ventilation mode", example: "VCV", maxLength: 20 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage(INVALID_MESSAGE) })
  @MaxLength(20, { message: i18nValidationMessage(INVALID_MESSAGE) })
  public mode?: string;

  @SnapshotNumber("Applied tidal volume (mL)", 420) public tidalVolumeMl?: number;
  @SnapshotNumber("Applied respiratory rate (breaths/min)", 22) public respiratoryRateBpm?: number;
  @SnapshotNumber("Applied PEEP (cmH2O)", 5) public peepCmH2O?: number;
  @SnapshotNumber("Applied FiO2 (fraction)", 0.9) public fio2?: number;
}

export class ClientSimulationSnapshotDTO {
  @SnapshotNumber("SpO2 shown (%)", 72.2) public spo2Percent?: number;
  @SnapshotNumber("PaO2 shown (mmHg)", 38) public pao2MmHg?: number;
  @SnapshotNumber("PaCO2 shown (mmHg)", 33.4) public paco2MmHg?: number;
  @SnapshotNumber("pH shown", 7.48) public ph?: number;
  @SnapshotNumber("Mean arterial pressure shown (mmHg)", 66) public mapMmHg?: number;
  @SnapshotNumber("Heart rate shown (beats/min)", 107) public heartRateBpm?: number;
  @SnapshotNumber("Patient severity shown (0..1)", 0.69) public severity?: number;

  @ApiPropertyOptional({ description: "Patient status shown", example: "CRITICAL", maxLength: 20 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage(INVALID_MESSAGE) })
  @MaxLength(20, { message: i18nValidationMessage(INVALID_MESSAGE) })
  public status?: string;

  @ApiPropertyOptional({ description: "Active alarms shown, with their priority", type: ClientSnapshotAlarmDTO, isArray: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage(INVALID_MESSAGE) })
  @ArrayMaxSize(MAX_CLIENT_SNAPSHOT_ALARMS, { message: i18nValidationMessage(INVALID_MESSAGE) })
  @ValidateNested({ each: true })
  @Type(() => ClientSnapshotAlarmDTO)
  public alarms?: ClientSnapshotAlarmDTO[];

  @ApiPropertyOptional({ type: ClientSnapshotSettingsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSnapshotSettingsDTO)
  public settings?: ClientSnapshotSettingsDTO;
}

/** Console context of a help request of a simulation session (assist and alarm help) */
export class SimulationHelpContextDTO {
  @ApiPropertyOptional({
    description:
      "Current simulated time of the console (ms). The server rebuilds the state up to it: never behind the last stored event (a lag up to 1 s is moved up to it), never ahead of the elapsed wall time × session multiplier (+ tolerance) or the exam deadline. Without it the server estimates the time from the wall clock.",
    example: 76200,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("simulation.validation.sim_time_ms_invalid") })
  @Min(0, { message: i18nValidationMessage("simulation.validation.sim_time_ms_invalid") })
  public simTimeMs?: number;

  @ApiPropertyOptional({ description: "true when the console could not send its pending changes before asking (bounded flush timed out)", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage(INVALID_MESSAGE) })
  public unsentChanges?: boolean;

  @ApiPropertyOptional({
    description: "What the console shows; only compared with the server replay (a divergence is logged), never used as the state",
    type: ClientSimulationSnapshotDTO,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSimulationSnapshotDTO)
  public clientSnapshot?: ClientSimulationSnapshotDTO;
}

export function toClientAssistSnapshot(dto: ClientSimulationSnapshotDTO | undefined): ClientAssistSnapshot | undefined {
  if (dto === undefined) {
    return undefined;
  }

  return {
    spo2Percent: dto.spo2Percent,
    pao2MmHg: dto.pao2MmHg,
    paco2MmHg: dto.paco2MmHg,
    ph: dto.ph,
    mapMmHg: dto.mapMmHg,
    heartRateBpm: dto.heartRateBpm,
    severity: dto.severity,
    status: dto.status,
    alarms: dto.alarms?.map((alarm: ClientSnapshotAlarmDTO) => ({ code: alarm.code, severity: alarm.severity })),
    settings: dto.settings === undefined
      ? undefined
      : { mode: dto.settings.mode, tidalVolumeMl: dto.settings.tidalVolumeMl, respiratoryRateBpm: dto.settings.respiratoryRateBpm, peepCmH2O: dto.settings.peepCmH2O, fio2: dto.settings.fio2 },
  };
}
