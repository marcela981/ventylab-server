/*
 * Funcionalidad: DTOs curriculum-request.dto
 * Descripción: Define los DTOs CurriculumLevelParamsDTO de la feature de currículo, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { CURRICULUM_LEVEL_VALUES } from "@/features/curriculum/domain/value-objects/curriculum-level";

export class CurriculumLevelParamsDTO {
  @ApiProperty({ description: "Curriculum level", enum: CURRICULUM_LEVEL_VALUES, example: "intermediate" })
  @IsIn([...CURRICULUM_LEVEL_VALUES], { message: i18nValidationMessage("curriculum.validation.level_invalid") })
  public level: string;
}
