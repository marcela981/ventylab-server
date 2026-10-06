/*
 * Funcionalidad: DTOs de petición de relaciones profesor-estudiante
 * Descripción: Validación y documentación Swagger del cuerpo para asignar un estudiante a un profesor y del parámetro includeProgress del listado de estudiantes de un profesor
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class AssignStudentDTO {
  @ApiProperty({ description: "Teacher user ID (TEACHER or ADMIN role)", example: "cm5teacher01" })
  @IsString({ message: i18nValidationMessage("teacher-students.validation.teacher_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("teacher-students.validation.teacher_id_required") })
  public teacherId: string;

  @ApiProperty({ description: "Student user ID (STUDENT role)", example: "cm5student01" })
  @IsString({ message: i18nValidationMessage("teacher-students.validation.student_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("teacher-students.validation.student_id_required") })
  public studentId: string;
}

export class GetTeacherStudentsQueryDTO {
  @ApiPropertyOptional({ description: "Include the lesson progress summary of each student", enum: ["true", "false"], example: "true" })
  @IsOptional()
  @IsIn(["true", "false"], { message: i18nValidationMessage("teacher-students.validation.include_progress_invalid") })
  public includeProgress?: string;
}
