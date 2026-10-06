/*
 * Funcionalidad: Caso de uso UpdateLessonUseCase
 * Descripción: Ejecuta la operación UpdateLesson de la feature de lecciones; depende de IEventBus, ITransactionManager, ILessonRepository
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
import { UpdateLessonCommand } from "@/features/lessons/application/commands/update-lesson.command";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { InvalidLessonContentError, LessonNotFoundError, LessonOrderAlreadyTakenError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { isValidLessonContent, serializeLessonContent } from "@/features/lessons/domain/services/lesson-content";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {LessonOrderAlreadyTakenError} If another lesson of the module already has the new order
 * @throws {InvalidLessonContentError} If new content has no type or no sections
 */
@Injectable()
export class UpdateLessonUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpdateLessonCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      if (
        command.order !== undefined &&
        command.order !== lesson.order &&
        (await this._lessonsRepository.getByOrderInModule(lesson.moduleId, command.order, lesson.id, transaction))
      ) {
        throw new LessonOrderAlreadyTakenError(command.order);
      }

      if (command.content !== undefined && !isValidLessonContent(command.content)) {
        throw new InvalidLessonContentError();
      }

      lesson.update({
        title: command.title,
        content: command.content === undefined ? undefined : serializeLessonContent(command.content),
        order: command.order,
        estimatedTime: command.estimatedTime,
        aiGenerated: command.aiGenerated,
        sourcePrompt: command.sourcePrompt,
        status: command.status,
        performedBy: command.performedBy,
      });

      await this._lessonsRepository.save(lesson, transaction);

      this._eventBus.publish(lesson.getEvents());
    });
  }
}
