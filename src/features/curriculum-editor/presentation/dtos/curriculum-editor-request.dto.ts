/*
 * Funcionalidad: DTOs de solicitud del editor del currículo
 * Descripción: Valida con class-validator los cuerpos y parámetros de consulta para consultar el árbol, crear, actualizar y eliminar nodos y guardar los bloques de una lección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import {
  CURRICULUM_NODE_TYPE_VALUES,
  type CurriculumNodeTypeValue,
} from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";

export class CurriculumTreeQueryDTO {
  @ApiPropertyOptional({ description: "Curriculum track filter", example: "mecanica" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public track?: string;
}

export class CurriculumNodeTypeQueryDTO {
  @ApiProperty({ description: "Node type", enum: CURRICULUM_NODE_TYPE_VALUES, example: "level" })
  @IsIn([...CURRICULUM_NODE_TYPE_VALUES], { message: i18nValidationMessage("curriculum-editor.validation.type_invalid") })
  public type: CurriculumNodeTypeValue;
}

export class CreateCurriculumNodeDTO {
  @ApiProperty({ description: "Node type", enum: CURRICULUM_NODE_TYPE_VALUES, example: "level" })
  @IsIn([...CURRICULUM_NODE_TYPE_VALUES], { message: i18nValidationMessage("curriculum-editor.validation.type_invalid") })
  public type: CurriculumNodeTypeValue;

  @ApiProperty({ description: "Node title", example: "Nivel principiante" })
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("curriculum-editor.validation.title_required") })
  public title: string;

  @ApiPropertyOptional({ description: "Parent level ID; for type=level it creates a sublevel", example: "level-beginner" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public parentId?: string;

  @ApiPropertyOptional({ description: "Owning level ID; required for type=module", example: "level-beginner" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public levelId?: string;

  @ApiPropertyOptional({ description: "Curriculum track for levels", example: "mecanica", default: "mecanica" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public track?: string;

  @ApiPropertyOptional({ description: "Node description", example: "Fundamentos de ventilación mecánica" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string;

  @ApiPropertyOptional({ description: "Node color", example: "#3B82F6" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public color?: string;

  @ApiPropertyOptional({ description: "Tags", example: ["core"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("curriculum-editor.validation.tags_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("curriculum-editor.validation.tags_invalid") })
  public tags?: string[];

  @ApiPropertyOptional({ description: "Display order, defaults to the next position among its siblings", example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("curriculum-editor.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("curriculum-editor.validation.order_invalid") })
  public order?: number;
}

export class UpdateCurriculumNodeDTO {
  @ApiPropertyOptional({ description: "Node title", example: "Nivel principiante" })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("curriculum-editor.validation.title_required") })
  public title?: string;

  @ApiPropertyOptional({ description: "Node description", example: "Fundamentos de ventilación mecánica" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public description?: string;

  @ApiPropertyOptional({ description: "Node color", example: "#3B82F6" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public color?: string;

  @ApiPropertyOptional({ description: "Tags", example: ["core"], type: [String] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage("curriculum-editor.validation.tags_invalid") })
  @IsString({ each: true, message: i18nValidationMessage("curriculum-editor.validation.tags_invalid") })
  public tags?: string[];

  @ApiPropertyOptional({ description: "Display order", example: 1, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("curriculum-editor.validation.order_invalid") })
  @Min(0, { message: i18nValidationMessage("curriculum-editor.validation.order_invalid") })
  public order?: number;

  @ApiPropertyOptional({ description: "Whether the node is active", example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public isActive?: boolean;
}

export class SaveLessonBlocksDTO {
  @ApiProperty({ description: "Notion-style content blocks", example: [{ type: "paragraph", content: "Texto" }], type: "array", items: { type: "object" } })
  @IsArray({ message: i18nValidationMessage("curriculum-editor.validation.blocks_invalid") })
  public blocks: unknown[];
}
