/*
 * Funcionalidad: Caso de uso DeleteModuleUseCase
 * Descripción: Elimina físicamente un módulo con sus lecciones, páginas y bloques cuando no hay datos de estudiantes, delegando en DeleteCurriculumSubtreeUseCase; si los hay responde 409 sugiriendo archivar
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
import { MODULE_NODE_KIND } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { DeleteModuleCommand } from "@/features/modules/application/commands/delete-module.command";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the module or any descendant has student data
 */
@Injectable()
export class DeleteModuleUseCase {
  public constructor(private readonly _deleteCurriculumSubtreeUseCase: DeleteCurriculumSubtreeUseCase) {}

  public async execute(command: DeleteModuleCommand): Promise<void> {
    const deleted: boolean = await this._deleteCurriculumSubtreeUseCase.execute(
      new DeleteCurriculumSubtreeCommand({ kind: MODULE_NODE_KIND, id: command.moduleId, performedBy: command.performedBy }),
    );

    if (!deleted) {
      throw new ModuleNotFoundError();
    }
  }
}
