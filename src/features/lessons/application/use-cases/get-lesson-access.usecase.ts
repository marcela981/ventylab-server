/*
 * Funcionalidad: Caso de uso GetLessonAccessUseCase
 * Descripción: Indica si el usuario autenticado puede abrir una lección (módulo desbloqueado y lecciones anteriores con páginas completadas, bypass de staff) consultando LearningProgressFacade.getLessonAccess; 404 si la lección no existe o no es visible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { LearningProgressFacade } from "@/features/progress/application/services/learning-progress.facade";
import { type LessonAccessDecision } from "@/features/progress/domain/read-models/lesson-access.read-model";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist or is not visible to the caller
 */
@Injectable()
export class GetLessonAccessUseCase {
  public constructor(private readonly _learningProgressFacade: LearningProgressFacade) {}

  public async execute(userId: string, lessonId: string, canManage: boolean): Promise<LessonAccessDecision> {
    const decision: LessonAccessDecision | undefined = await this._learningProgressFacade.getLessonAccess(userId, lessonId, canManage);

    if (!decision) {
      throw new LessonNotFoundError();
    }

    return decision;
  }
}
