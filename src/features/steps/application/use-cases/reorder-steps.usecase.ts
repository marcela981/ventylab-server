/*
 * Funcionalidad: Caso de uso ReorderStepsUseCase
 * Descripción: Ejecuta la operación ReorderSteps de la feature de pasos (tarjetas); depende de IEventBus, ITransactionManager, ILessonRepository, IStepRepository
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
import { buildReorderPlan, type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { ReorderStepsCommand } from "@/features/steps/application/commands/reorder-steps.command";
import { StepsReorderedEvent } from "@/features/steps/domain/events/step.events";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { InvalidStepReorderError } from "@/features/steps/domain/steps.errors";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {InvalidStepReorderError} If the list is empty, has duplicates or contains steps outside the lesson
 */
@Injectable()
export class ReorderStepsUseCase {
  public constructor(
    @Inject(STEPS_REPOSITORY_TOKEN)
    private readonly _stepsRepository: IStepRepository,
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: ReorderStepsCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      const current: OrderedItem[] = await this._stepsRepository.getOrderedItemsInLesson(lesson.id, transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, command.stepIds, false);

      if (!plan) {
        throw new InvalidStepReorderError();
      }

      await this._stepsRepository.applyOrder(plan, transaction);

      const requestedIds: Set<string> = new Set(command.stepIds);

      this._eventBus.publish([
        new StepsReorderedEvent({
          lessonId: lesson.id,
          previousOrder: Object.fromEntries(current.filter((item: OrderedItem) => requestedIds.has(item.id)).map((item: OrderedItem) => [item.id, item.order])),
          newOrder: Object.fromEntries(plan.map((entry: ReorderEntry) => [entry.id, entry.order])),
          performedBy: command.performedBy,
        }),
      ]);
    });
  }
}
