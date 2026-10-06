/*
 * Funcionalidad: DTOs de solicitud de casos clínicos
 * Descripción: Valida los filtros paginados del listado (dificultad, patología) y la configuración del ventilador enviada para evaluar un caso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsDefined, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min, ValidateIf, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { CASE_DIFFICULTY_VALUES } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import { PATHOLOGY_VALUES } from "@/features/clinical-cases/domain/value-objects/pathology";

const toUpperCase = ({ value }: { value: unknown }): unknown => (typeof value === "string" ? value.toUpperCase() : value);

export class GetClinicalCasesQueryDTO extends ListQueryDTO {
  @ApiPropertyOptional({ description: "Filter by difficulty (case-insensitive)", enum: CASE_DIFFICULTY_VALUES, example: "BEGINNER" })
  @IsOptional()
  @Transform(toUpperCase)
  @IsIn([...CASE_DIFFICULTY_VALUES], { message: i18nValidationMessage("clinical-cases.validation.difficulty_invalid") })
  public difficulty?: string;

  @ApiPropertyOptional({ description: "Filter by pathology (case-insensitive)", enum: PATHOLOGY_VALUES, example: "EPOC" })
  @IsOptional()
  @Transform(toUpperCase)
  @IsIn([...PATHOLOGY_VALUES], { message: i18nValidationMessage("clinical-cases.validation.pathology_invalid") })
  public pathology?: string;
}

export class VentilatorConfigurationDTO {
  @ApiProperty({ description: "Ventilation mode", example: "volume" })
  @IsString({ message: i18nValidationMessage("clinical-cases.validation.ventilation_mode_required") })
  @IsNotEmpty({ message: i18nValidationMessage("clinical-cases.validation.ventilation_mode_required") })
  public ventilationMode: string;

  @ApiPropertyOptional({ description: "Tidal volume in ml", example: 450, minimum: 0 })
  @ValidateIf((dto: VentilatorConfigurationDTO) => dto.tidalVolume !== undefined)
  @IsNumber({}, { message: i18nValidationMessage("clinical-cases.validation.tidal_volume_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.tidal_volume_invalid") })
  public tidalVolume?: number;

  @ApiPropertyOptional({ description: "Respiratory rate in breaths per minute", example: 14, minimum: 0 })
  @ValidateIf((dto: VentilatorConfigurationDTO) => dto.respiratoryRate !== undefined)
  @IsNumber({}, { message: i18nValidationMessage("clinical-cases.validation.respiratory_rate_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.respiratory_rate_invalid") })
  public respiratoryRate?: number;

  @ApiPropertyOptional({ description: "PEEP in cmH2O", example: 5, minimum: 0 })
  @ValidateIf((dto: VentilatorConfigurationDTO) => dto.peep !== undefined)
  @IsNumber({}, { message: i18nValidationMessage("clinical-cases.validation.peep_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.peep_invalid") })
  public peep?: number;

  @ApiPropertyOptional({ description: "FiO2 percentage", example: 40, minimum: 0, maximum: 100 })
  @ValidateIf((dto: VentilatorConfigurationDTO) => dto.fio2 !== undefined)
  @IsNumber({}, { message: i18nValidationMessage("clinical-cases.validation.fio2_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.fio2_invalid") })
  @Max(100, { message: i18nValidationMessage("clinical-cases.validation.fio2_invalid") })
  public fio2?: number;

  @ApiPropertyOptional({ description: "Maximum pressure in cmH2O", example: 30, minimum: 0 })
  @ValidateIf((dto: VentilatorConfigurationDTO) => dto.maxPressure !== undefined)
  @IsNumber({}, { message: i18nValidationMessage("clinical-cases.validation.max_pressure_invalid") })
  @Min(0, { message: i18nValidationMessage("clinical-cases.validation.max_pressure_invalid") })
  public maxPressure?: number;

  @ApiPropertyOptional({ description: "Inspiration to expiration ratio", example: "1:2" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public iERatio?: string;
}

export class EvaluateClinicalCaseDTO {
  @ApiProperty({ description: "Ventilator configuration chosen by the student", type: VentilatorConfigurationDTO })
  @IsDefined({ message: i18nValidationMessage("clinical-cases.validation.configuration_required") })
  @IsObject({ message: i18nValidationMessage("clinical-cases.validation.configuration_required") })
  @ValidateNested()
  @Type(() => VentilatorConfigurationDTO)
  public configuration: VentilatorConfigurationDTO;
}
