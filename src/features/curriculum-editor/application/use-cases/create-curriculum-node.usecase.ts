/*
 * Funcionalidad: Creación de nodo del currículo
 * Descripción: Crea un nivel, subnivel o módulo desde el editor del currículo delegando en CreateLevelNodeUseCase o CreateModuleNodeUseCase según el tipo de nodo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { CreateCurriculumNodeCommand } from "@/features/curriculum-editor/application/commands/create-curriculum-node.command";
import { LEVEL_CURRICULUM_NODE_TYPE } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";
import { CreateLevelNodeCommand } from "@/features/levels/application/commands/create-level-node.command";
import { CreateLevelNodeUseCase } from "@/features/levels/application/use-cases/create-level-node.usecase";
import { CreateModuleNodeCommand } from "@/features/modules/application/commands/create-module-node.command";
import { CreateModuleNodeUseCase } from "@/features/modules/application/use-cases/create-module-node.usecase";

/**
 * @throws {ParentLevelNotFoundError} If a level node is created under a parent that does not exist
 * @throws {LevelTitleAlreadyExistsError} If another level already has the title (case-insensitive)
 * @throws {ModuleNodeLevelRequiredError} If a module node is created without a level ID
 * @throws {LevelNotFoundError} If the level that owns a new module does not exist
 */
@Injectable()
export class CreateCurriculumNodeUseCase {
  public constructor(
    private readonly _createLevelNodeUseCase: CreateLevelNodeUseCase,
    private readonly _createModuleNodeUseCase: CreateModuleNodeUseCase,
  ) {}

  public async execute(command: CreateCurriculumNodeCommand): Promise<void> {
    if (command.type === LEVEL_CURRICULUM_NODE_TYPE) {
      await this._createLevelNodeUseCase.execute(
        new CreateLevelNodeCommand({
          title: command.title,
          parentId: command.parentId,
          track: command.track,
          description: command.description,
          color: command.color,
          tags: command.tags,
          order: command.order,
          performedBy: command.performedBy,
        }),
      );

      return;
    }

    await this._createModuleNodeUseCase.execute(
      new CreateModuleNodeCommand({
        levelId: command.levelId,
        title: command.title,
        description: command.description,
        color: command.color,
        tags: command.tags,
        order: command.order,
        performedBy: command.performedBy,
      }),
    );
  }
}
