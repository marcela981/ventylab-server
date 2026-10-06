/*
 * Funcionalidad: Eliminación de nodo del currículo
 * Descripción: Elimina de forma permanente un nivel con todos sus subniveles o un módulo con su contenido, delegando en DeleteLevelUseCase o DeleteModuleUseCase; ambos aplican la guarda de datos de estudiantes y responden 409 sugiriendo archivar
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { DeleteCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/delete-curriculum-node.command";
import { LEVEL_CURRICULUM_NODE_TYPE } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";
import { DeleteLevelCommand } from "@/features/levels/application/commands/delete-level.command";
import { DeleteLevelUseCase } from "@/features/levels/application/use-cases/delete-level.usecase";
import { DeleteModuleCommand } from "@/features/modules/application/commands/delete-module.command";
import { DeleteModuleUseCase } from "@/features/modules/application/use-cases/delete-module.usecase";

/**
 * @throws {LevelNotFoundError} If the level node does not exist
 * @throws {ModuleNotFoundError} If the module node does not exist
 * @throws {CurriculumNodeHasStudentDataError} If the node or any descendant has student data
 */
@Injectable()
export class DeleteCurriculumNodeUseCase {
  public constructor(
    private readonly _deleteLevelUseCase: DeleteLevelUseCase,
    private readonly _deleteModuleUseCase: DeleteModuleUseCase,
  ) {}

  public async execute(command: DeleteCurriculumNodeCommand): Promise<void> {
    if (command.type === LEVEL_CURRICULUM_NODE_TYPE) {
      await this._deleteLevelUseCase.execute(new DeleteLevelCommand({ levelId: command.id, performedBy: command.performedBy }));

      return;
    }

    await this._deleteModuleUseCase.execute(new DeleteModuleCommand({ moduleId: command.id, performedBy: command.performedBy }));
  }
}
