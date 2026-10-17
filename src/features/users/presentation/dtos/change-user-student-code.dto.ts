/*
 * Funcionalidad: DTO ChangeUserStudentCodeDTO
 * Descripción: Cuerpo de la petición con la que un administrador asigna o quita (null) el código estudiantil de un usuario: se recorta y debe tener de 1 a 32 letras, dígitos o guiones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, Length, Matches, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { STUDENT_CODE_MAX_LENGTH, STUDENT_CODE_PATTERN } from "@/features/users/domain/value-objects/student-code";

export class ChangeUserStudentCodeDTO {
  @ApiProperty({
    description: "Institutional student code (trimmed; letters, digits and hyphens), unique per user; null removes it",
    example: "2026-0001",
    minLength: 1,
    maxLength: STUDENT_CODE_MAX_LENGTH,
    pattern: STUDENT_CODE_PATTERN.source,
    nullable: true,
    type: String,
  })
  @Transform(({ value }: { value: unknown }): unknown => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((dto: ChangeUserStudentCodeDTO): boolean => dto.studentCode !== null)
  @IsString({ message: i18nValidationMessage("users.validation.student_code_invalid") })
  @Length(1, STUDENT_CODE_MAX_LENGTH, { message: i18nValidationMessage("users.validation.student_code_invalid") })
  @Matches(STUDENT_CODE_PATTERN, { message: i18nValidationMessage("users.validation.student_code_invalid") })
  public studentCode: string | null;
}
