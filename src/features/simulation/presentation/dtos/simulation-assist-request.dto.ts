/*
 * Funcionalidad: DTO de solicitud de asistencia de simulación
 * Descripción: Validación de entrada de la asistencia de IA de una sesión de simulación: pregunta opcional del estudiante (máximo 1000 caracteres) e idioma opcional de la respuesta (es o en)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { LANGUAGE_VALUES } from "@/common/domain/value-objects/language";

export const MAX_SIMULATION_ASSIST_QUESTION_LENGTH: number = 1000;

export class SimulationAssistDTO {
  @ApiPropertyOptional({
    description: "Student question; without it the assistant reviews the current state of the simulation",
    example: "¿Por qué sigue sonando la alarma de presión alta?",
    maxLength: MAX_SIMULATION_ASSIST_QUESTION_LENGTH,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("simulation.validation.assist_question_string") })
  @MaxLength(MAX_SIMULATION_ASSIST_QUESTION_LENGTH, { message: i18nValidationMessage("simulation.validation.assist_question_too_long") })
  public question?: string;

  @ApiPropertyOptional({ description: "Answer language; defaults to the request language", enum: LANGUAGE_VALUES, example: "es" })
  @IsOptional()
  @IsIn([...LANGUAGE_VALUES], { message: i18nValidationMessage("simulation.validation.assist_language_invalid") })
  public language?: string;
}
