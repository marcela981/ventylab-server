/*
 * Funcionalidad: DTOs del acceso secuencial a una lección
 * Descripción: Define LessonAccessDTO (allowed, reason y missing) y MissingLessonDTO, la respuesta de GET /api/lessons/:id/access documentada con Swagger
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { LESSON_ACCESS_REASON_VALUES } from "@/features/progress/domain/read-models/lesson-access.read-model";

export class MissingLessonDTO {
  @ApiProperty({ description: "ID of a previous lesson that must be completed first", example: "cm1lesson00001" })
  public lessonId: string;

  @ApiProperty({ description: "Title of that lesson", example: "Ecuación del movimiento" })
  public title: string;
}

export class LessonAccessDTO {
  @ApiProperty({ description: "Whether the current user can open the lesson (always true for content managers)", example: false })
  public allowed: boolean;

  @ApiProperty({
    description: "Why the lesson is locked: module_locked (its module is still locked) or previous_lesson_incomplete (see missing); null when allowed",
    enum: LESSON_ACCESS_REASON_VALUES,
    nullable: true,
    type: String,
    example: "previous_lesson_incomplete",
  })
  public reason: string | null;

  @ApiProperty({
    description: "Previous published lessons with published pages that are not completed yet, in lesson order; empty unless reason is previous_lesson_incomplete",
    type: MissingLessonDTO,
    isArray: true,
  })
  public missing: MissingLessonDTO[];
}
