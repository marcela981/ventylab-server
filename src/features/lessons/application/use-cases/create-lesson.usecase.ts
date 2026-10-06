/*
 * Funcionalidad: Caso de uso CreateLessonUseCase
 * Descripción: Ejecuta la operación CreateLesson de la feature de lecciones; depende de IEventBus, ITransactionManager, ILessonRepository, IModuleRepository
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { CreateLessonCommand } from "@/features/lessons/application/commands/create-lesson.command";
import { Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import {
  InactiveModuleLessonCreationError,
  InvalidLessonContentError,
  LessonOrderAlreadyTakenError,
} from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { isValidLessonContent, serializeLessonContent } from "@/features/lessons/domain/services/lesson-content";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {InactiveModuleLessonCreationError} If the module is not active
 * @throws {InvalidLessonContentError} If the content has no type or no sections
 * @throws {LessonOrderAlreadyTakenError} If another lesson of the module already has the order
 */
@Injectable()
export class CreateLessonUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateLessonCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(command.moduleId, transaction);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      if (!module.isActive) {
        throw new InactiveModuleLessonCreationError();
      }

      if (!isValidLessonContent(command.content)) {
        throw new InvalidLessonContentError();
      }

      const order: number = command.order ?? 0;

      if (await this._lessonsRepository.getByOrderInModule(module.id, order, undefined, transaction)) {
        throw new LessonOrderAlreadyTakenError(order);
      }

      const lesson: Lesson = Lesson.create({
        moduleId: module.id,
        title: command.title,
        content: serializeLessonContent(command.content),
        order,
        estimatedTime: command.estimatedTime ?? 0,
        aiGenerated: command.aiGenerated ?? false,
        sourcePrompt: command.sourcePrompt,
        status: command.status,
        performedBy: command.performedBy,
      });

      await this._lessonsRepository.save(lesson, transaction);

      this._eventBus.publish(lesson.getEvents());
    });
  }
}
