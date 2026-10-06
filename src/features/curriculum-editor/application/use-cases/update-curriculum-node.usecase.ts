/*
 * Funcionalidad: Actualización de nodo del currículo
 * Descripción: Actualiza un nivel o módulo desde el editor del currículo delegando en UpdateLevelNodeUseCase o UpdateModuleNodeUseCase según el tipo de nodo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { UpdateCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/update-curriculum-node.command";
import { LEVEL_CURRICULUM_NODE_TYPE } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";
import { UpdateLevelNodeCommand } from "@/features/levels/application/commands/update-level-node.command";
import { UpdateLevelNodeUseCase } from "@/features/levels/application/use-cases/update-level-node.usecase";
import { UpdateModuleNodeCommand } from "@/features/modules/application/commands/update-module-node.command";
import { UpdateModuleNodeUseCase } from "@/features/modules/application/use-cases/update-module-node.usecase";

/**
 * @throws {LevelNotFoundError} If the level node does not exist
 * @throws {LevelTitleAlreadyExistsError} If another level already has the new title (case-insensitive)
 * @throws {ModuleNotFoundError} If the module node does not exist
 */
@Injectable()
export class UpdateCurriculumNodeUseCase {
  public constructor(
    private readonly _updateLevelNodeUseCase: UpdateLevelNodeUseCase,
    private readonly _updateModuleNodeUseCase: UpdateModuleNodeUseCase,
  ) {}

  public async execute(command: UpdateCurriculumNodeCommand): Promise<void> {
    if (command.type === LEVEL_CURRICULUM_NODE_TYPE) {
      await this._updateLevelNodeUseCase.execute(
        new UpdateLevelNodeCommand({
          levelId: command.id,
          title: command.title,
          description: command.description,
          color: command.color,
          tags: command.tags,
          order: command.order,
          isActive: command.isActive,
          performedBy: command.performedBy,
        }),
      );

      return;
    }

    await this._updateModuleNodeUseCase.execute(
      new UpdateModuleNodeCommand({
        moduleId: command.id,
        title: command.title,
        description: command.description,
        color: command.color,
        tags: command.tags,
        order: command.order,
        isActive: command.isActive,
        performedBy: command.performedBy,
      }),
    );
  }
}
