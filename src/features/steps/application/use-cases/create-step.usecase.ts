/*
 * Funcionalidad: Caso de uso CreateStepUseCase
 * Descripción: Ejecuta la operación CreateStep de la feature de pasos (tarjetas); depende de IEventBus, ITransactionManager, ILessonRepository, IStepRepository
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
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { CreateStepCommand } from "@/features/steps/application/commands/create-step.command";
import { Step } from "@/features/steps/domain/entities/step.entity";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { InactiveLessonStepCreationError, StepOrderAlreadyTakenError } from "@/features/steps/domain/steps.errors";
import { TEXT_STEP_CONTENT_TYPE } from "@/features/steps/domain/value-objects/step-content-type";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {InactiveLessonStepCreationError} If the lesson is not active
 * @throws {StepOrderAlreadyTakenError} If another step of the lesson already has the requested order
 */
@Injectable()
export class CreateStepUseCase {
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

  public async execute(command: CreateStepCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      if (!lesson.isActive) {
        throw new InactiveLessonStepCreationError();
      }

      if (command.order !== undefined && (await this._stepsRepository.getByOrderInLesson(lesson.id, command.order, undefined, transaction))) {
        throw new StepOrderAlreadyTakenError(command.order);
      }

      const order: number = command.order ?? ((await this._stepsRepository.getMaxOrderInLesson(lesson.id, transaction)) ?? -1) + 1;

      const step: Step = Step.create({
        lessonId: lesson.id,
        title: command.title,
        content: command.content,
        contentType: command.contentType ?? TEXT_STEP_CONTENT_TYPE,
        order,
        performedBy: command.performedBy,
      });

      await this._stepsRepository.save(step, transaction);

      this._eventBus.publish(step.getEvents());
    });
  }
}
