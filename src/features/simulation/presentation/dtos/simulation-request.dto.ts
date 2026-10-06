/*
 * Funcionalidad: DTOs de solicitud de simulación
 * Descripción: Validan el comando del ventilador, la reserva (duración, propósito, grupo y líder), la apertura y el guardado de sesiones del simulador y los filtros de estado y listado de sesiones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Min, ValidateIf, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ConfigurePatientDTO } from "@/features/simulation/presentation/dtos/patient-request.dto";

export class SendVentilatorCommandDTO {
  @ApiProperty({
    description: "Ventilator settings (mode, tidalVolume, respiratoryRate, peep, fio2, optional pressureLimit and inspiratoryTime)",
    type: Object,
    example: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 },
  })
  @IsObject({ message: i18nValidationMessage("simulation.validation.command_required") })
  public command: Record<string, unknown>;
}

export class ReserveVentilatorDTO {
  @ApiProperty({ description: "Reservation length in minutes", example: 30, minimum: 1 })
  @IsInt({ message: i18nValidationMessage("simulation.validation.duration_positive") })
  @Min(1, { message: i18nValidationMessage("simulation.validation.duration_positive") })
  public durationMinutes: number;

  @ApiPropertyOptional({ description: "Purpose of the reservation", example: "Practice" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public purpose?: string;

  @ApiPropertyOptional({ description: "Group the ventilator is reserved for", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({ description: "User who receives the telemetry; defaults to the group's simulator leader when a group is given", example: "cm5user01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public leaderId?: string;
}

export class CreateSimulatorSessionDTO {
  @ApiPropertyOptional({ description: "true for the physical ventilator, false (default) for the simulated patient", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isRealVentilator?: boolean;

  @ApiPropertyOptional({ description: "Patient configuration, required when isRealVentilator is false", type: ConfigurePatientDTO })
  @ValidateIf((dto: CreateSimulatorSessionDTO): boolean => dto.isRealVentilator !== true)
  @IsObject({ message: i18nValidationMessage("simulation.validation.patient_data_required") })
  @ValidateNested()
  @Type(() => ConfigurePatientDTO)
  public patientData?: ConfigurePatientDTO;

  @ApiPropertyOptional({ description: "Initial parameters log", type: [Object] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("simulation.validation.array") })
  public parametersLog?: unknown[];

  @ApiPropertyOptional({ description: "Initial ventilator readings", type: [Object] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("simulation.validation.array") })
  public ventilatorData?: unknown[];

  @ApiPropertyOptional({ description: "Session notes", example: "First practice" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public notes?: string;

  @ApiPropertyOptional({ description: "Related clinical case ID (clinical cases table)", example: "cm5case01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public clinicalCaseId?: string;
}

export class SaveSimulatorSessionDTO {
  @ApiPropertyOptional({ description: "true for the physical ventilator, defaults to false", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isRealVentilator?: boolean;

  @ApiProperty({ description: "Commands applied during the session", type: [Object] })
  @IsArray({ message: i18nValidationMessage("simulation.validation.parameters_log_array") })
  public parametersLog: unknown[];

  @ApiProperty({ description: "Readings recorded during the session", type: [Object] })
  @IsArray({ message: i18nValidationMessage("simulation.validation.ventilator_data_array") })
  public ventilatorData: unknown[];

  @ApiPropertyOptional({ description: "Session notes", example: "Good PEEP titration" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public notes?: string;

  @ApiPropertyOptional({ description: "Related clinical case ID (clinical cases table)", example: "cm5case01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public clinicalCaseId?: string;
}

export class GetSimulatorSessionsQueryDTO {
  @ApiPropertyOptional({ description: "Maximum number of sessions", example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("simulation.validation.limit_positive") })
  @Min(1, { message: i18nValidationMessage("simulation.validation.limit_positive") })
  public limit?: number;
}

export class GetVentilatorStatusQueryDTO {
  @ApiPropertyOptional({ description: "Device ID, defaults to the configured ventilator", example: "ventilab-device-001" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public deviceId?: string;
}
