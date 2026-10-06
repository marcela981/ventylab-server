/*
 * Funcionalidad: DTOs override-request.dto
 * Descripción: Define los DTOs FieldOverridesDTO, ExtraCardDTO, OverrideDataDTO, CreateOverrideDTO, UpdateOverrideDTO, GetOverridesQueryDTO de la feature de personalizaciones de contenido por estudiante, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { OVERRIDE_ENTITY_TYPE_VALUES } from "@/features/overrides/domain/value-objects/override-entity-type";
import { STEP_CONTENT_TYPE_VALUES } from "@/features/steps/domain/value-objects/step-content-type";

export class FieldOverridesDTO {
  @ApiPropertyOptional({ description: "Overridden title", example: "Versión simplificada", maxLength: 200 })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(200, { message: i18nValidationMessage("overrides.validation.title_max_length") })
  public title?: string;

  @ApiPropertyOptional({ description: "Overridden content", example: "<p>Contenido adaptado</p>" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public content?: string;

  @ApiPropertyOptional({ description: "Overridden order", example: 2, minimum: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("overrides.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("overrides.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Overridden active flag", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;

  @ApiPropertyOptional({ description: "Overridden estimated time in minutes, for lessons", example: 10, minimum: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage("overrides.validation.estimated_time_invalid") })
  @Min(0, { message: i18nValidationMessage("overrides.validation.estimated_time_invalid") })
  public estimatedTime?: number;

  @ApiPropertyOptional({ description: "Overridden content type, for cards", enum: STEP_CONTENT_TYPE_VALUES, example: "text" })
  @IsOptional()
  @IsIn([...STEP_CONTENT_TYPE_VALUES], { message: i18nValidationMessage("overrides.validation.content_type_invalid") })
  public contentType?: string;
}

export class ExtraCardDTO {
  @ApiProperty({ description: "Client-generated card ID", example: "0b6f3c1e-1a2b-4c3d-9e8f-1234567890ab" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("overrides.validation.extra_card_id_required") })
  public id: string;

  @ApiPropertyOptional({ description: "Card title", example: "Refuerzo" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public title?: string;

  @ApiProperty({ description: "Card content, JSON or HTML", example: "<p>Ejercicio adicional</p>" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("overrides.validation.extra_card_content_required") })
  public content: string;

  @ApiProperty({ description: "Card content type", enum: STEP_CONTENT_TYPE_VALUES, example: "text" })
  @IsIn([...STEP_CONTENT_TYPE_VALUES], { message: i18nValidationMessage("overrides.validation.content_type_invalid") })
  public contentType: string;

  @ApiProperty({ description: "Insert after the card with this order, -1 inserts at the beginning", example: 2, minimum: -1 })
  @IsInt({ message: i18nValidationMessage("overrides.validation.insert_after_order_invalid") })
  @Min(-1, { message: i18nValidationMessage("overrides.validation.insert_after_order_invalid") })
  public insertAfterOrder: number;
}

export class OverrideDataDTO {
  @ApiPropertyOptional({ description: "Field values that replace the original ones", type: FieldOverridesDTO })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("overrides.validation.field_overrides_invalid") })
  @ValidateNested()
  @Type(() => FieldOverridesDTO)
  public fieldOverrides?: FieldOverridesDTO;

  @ApiPropertyOptional({ description: "Extra cards inserted in the lesson, LESSON only", type: [ExtraCardDTO] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("overrides.validation.extra_cards_invalid") })
  @ValidateNested({ each: true })
  @Type(() => ExtraCardDTO)
  public extraCards?: ExtraCardDTO[];

  @ApiPropertyOptional({ description: "Card IDs hidden from the student, LESSON only", example: ["step-03"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("overrides.validation.hidden_card_ids_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("overrides.validation.hidden_card_ids_invalid") })
  public hiddenCardIds?: string[];
}

export class CreateOverrideDTO {
  @ApiProperty({ description: "Student ID", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("overrides.validation.student_id_required") })
  public studentId: string;

  @ApiProperty({ description: "Overridden entity type", enum: OVERRIDE_ENTITY_TYPE_VALUES, example: "LESSON" })
  @IsIn([...OVERRIDE_ENTITY_TYPE_VALUES], { message: i18nValidationMessage("overrides.validation.entity_type_invalid") })
  public entityType: string;

  @ApiProperty({ description: "Overridden entity ID", example: "lesson-01" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("overrides.validation.entity_id_required") })
  public entityId: string;

  @ApiProperty({ description: "Override data", type: OverrideDataDTO })
  @IsObject({ message: i18nValidationMessage("overrides.validation.override_data_invalid") })
  @ValidateNested()
  @Type(() => OverrideDataDTO)
  public overrideData: OverrideDataDTO;
}

export class UpdateOverrideDTO {
  @ApiPropertyOptional({ description: "New override data, replaces the previous data", type: OverrideDataDTO })
  @IsOptional()
  @IsObject({ message: i18nValidationMessage("overrides.validation.override_data_invalid") })
  @ValidateNested()
  @Type(() => OverrideDataDTO)
  public overrideData?: OverrideDataDTO;

  @ApiPropertyOptional({ description: "Whether the override is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class GetOverridesQueryDTO {
  @ApiProperty({ description: "Student ID", example: "cm5x2k9a00000abcd1234efgh" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("overrides.validation.student_id_required") })
  public studentId: string;

  @ApiPropertyOptional({ description: "Filter by entity type", enum: OVERRIDE_ENTITY_TYPE_VALUES, example: "LESSON" })
  @IsOptional()
  @IsIn([...OVERRIDE_ENTITY_TYPE_VALUES], { message: i18nValidationMessage("overrides.validation.entity_type_invalid") })
  public entityType?: string;

  @ApiPropertyOptional({ description: "Include inactive overrides", example: false, default: false })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === true || value === "true")
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public includeInactive?: boolean;
}
