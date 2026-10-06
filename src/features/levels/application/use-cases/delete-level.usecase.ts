/*
 * Funcionalidad: Caso de uso DeleteLevelUseCase
 * Descripción: Elimina físicamente un nivel con sus subniveles, módulos, lecciones y páginas cuando no hay datos de estudiantes, delegando en DeleteCurriculumSubtreeUseCase; si hay datos responde 409 sugiriendo archivar
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
import { LEVEL_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { DeleteLevelCommand } from "@/features/levels/application/commands/delete-level.command";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the level or any descendant has student data
 */
@Injectable()
export class DeleteLevelUseCase {
  public constructor(private readonly _deleteCurriculumSubtreeUseCase: DeleteCurriculumSubtreeUseCase) {}

  public async execute(command: DeleteLevelCommand): Promise<void> {
    const deleted: boolean = await this._deleteCurriculumSubtreeUseCase.execute(
      new DeleteCurriculumSubtreeCommand({ kind: LEVEL_NODE_KIND, id: command.levelId, performedBy: command.performedBy }),
    );

    if (!deleted) {
      throw new LevelNotFoundError();
    }
  }
}
