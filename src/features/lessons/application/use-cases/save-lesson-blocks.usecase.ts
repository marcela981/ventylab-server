/*
 * Funcionalidad: Caso de uso SaveLessonBlocksUseCase
 * Descripción: Ejecuta la operación SaveLessonBlocks de la feature de lecciones; depende de IEventBus, ITransactionManager, ILessonRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { SaveLessonBlocksCommand } from "@/features/lessons/application/commands/save-lesson-blocks.command";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 */
@Injectable()
export class SaveLessonBlocksUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: SaveLessonBlocksCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      lesson.saveBlocks(command.blocks, command.performedBy);

      await this._lessonsRepository.save(lesson, transaction);

      this._eventBus.publish(lesson.getEvents());
    });
  }
}
