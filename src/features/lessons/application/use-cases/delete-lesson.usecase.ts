/*
 * Funcionalidad: Caso de uso DeleteLessonUseCase
 * Descripción: Elimina físicamente una lección con sus páginas, bloques, pasos y quizzes cuando no hay datos de estudiantes, delegando en DeleteCurriculumSubtreeUseCase; si los hay responde 409 sugiriendo archivar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { DeleteCurriculumSubtreeCommand } from "@/features/curriculum/application/commands/delete-curriculum-subtree.command";
import { DeleteCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/delete-curriculum-subtree.usecase";
import { LESSON_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { DeleteLessonCommand } from "@/features/lessons/application/commands/delete-lesson.command";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the lesson or any of its pages has student data
 */
@Injectable()
export class DeleteLessonUseCase {
  public constructor(private readonly _deleteCurriculumSubtreeUseCase: DeleteCurriculumSubtreeUseCase) {}

  public async execute(command: DeleteLessonCommand): Promise<void> {
    const deleted: boolean = await this._deleteCurriculumSubtreeUseCase.execute(
      new DeleteCurriculumSubtreeCommand({ kind: LESSON_NODE_KIND, id: command.lessonId, performedBy: command.performedBy }),
    );

    if (!deleted) {
      throw new LessonNotFoundError();
    }
  }
}
