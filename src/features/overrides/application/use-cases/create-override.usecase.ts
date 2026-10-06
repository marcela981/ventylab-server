/*
 * Funcionalidad: Caso de uso CreateOverrideUseCase
 * Descripción: Ejecuta la operación CreateOverride de la feature de personalizaciones de contenido por estudiante; depende de IEventBus, ITransactionManager, ILessonRepository, ILevelRepository, CanManageOverridesUseCase, IContentOverrideRepository y otros
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
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { type Level } from "@/features/levels/domain/entities/level.entity";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { CreateOverrideCommand } from "@/features/overrides/application/commands/create-override.command";
import { CanManageOverridesUseCase } from "@/features/overrides/application/use-cases/can-manage-overrides.usecase";
import { ContentOverride } from "@/features/overrides/domain/entities/content-override.entity";
import {
  CannotManageOverridesError,
  ContentOverrideAlreadyExistsError,
  OverrideTargetNotFoundError,
} from "@/features/overrides/domain/overrides.errors";
import { type IContentOverrideRepository, OVERRIDES_REPOSITORY_TOKEN } from "@/features/overrides/domain/repositories/overrides.repository";
import {
  LESSON_OVERRIDE_ENTITY_TYPE,
  LEVEL_OVERRIDE_ENTITY_TYPE,
  type OverrideEntityTypeValue,
} from "@/features/overrides/domain/value-objects/override-entity-type";
import { type Step } from "@/features/steps/domain/entities/step.entity";
import { type IStepRepository, STEPS_REPOSITORY_TOKEN } from "@/features/steps/domain/repositories/steps.repository";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";

/**
 * @throws {CannotManageOverridesError} If the requester cannot manage overrides for the student
 * @throws {UserNotFoundError} If the student does not exist
 * @throws {UserNotStudentError} If the user is not a student
 * @throws {OverrideTargetNotFoundError} If the overridden level, lesson or card does not exist
 * @throws {InvalidOverrideDataError} If the override data does not fit the entity type
 * @throws {ContentOverrideAlreadyExistsError} If the student already has an override for the entity
 */
@Injectable()
export class CreateOverrideUseCase {
  public constructor(
    @Inject(OVERRIDES_REPOSITORY_TOKEN)
    private readonly _overridesRepository: IContentOverrideRepository,
    private readonly _canManageOverridesUseCase: CanManageOverridesUseCase,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(STEPS_REPOSITORY_TOKEN)
    private readonly _stepsRepository: IStepRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateOverrideCommand): Promise<void> {
    if (!(await this._canManageOverridesUseCase.execute(command.requesterId, command.requesterRole, command.studentId))) {
      throw new CannotManageOverridesError();
    }

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const student: User | undefined = await this._usersRepository.getById(command.studentId, transaction);

      if (!student) {
        throw new UserNotFoundError();
      }

      if (!student.role.isStudent()) {
        throw new UserNotStudentError();
      }

      if (!(await this._targetExists(command.entityType, command.entityId, transaction))) {
        throw new OverrideTargetNotFoundError(command.entityType, command.entityId);
      }

      const override: ContentOverride = ContentOverride.create({
        studentId: student.id,
        entityType: command.entityType,
        entityId: command.entityId,
        overrideData: command.overrideData,
        createdBy: command.requesterId,
      });

      if (await this._overridesRepository.existsForTarget(student.id, command.entityType, command.entityId, transaction)) {
        throw new ContentOverrideAlreadyExistsError();
      }

      await this._overridesRepository.save(override, transaction);

      this._eventBus.publish(override.getEvents());
    });
  }

  private async _targetExists(entityType: OverrideEntityTypeValue, entityId: string, transaction: unknown): Promise<boolean> {
    if (entityType === LEVEL_OVERRIDE_ENTITY_TYPE) {
      const level: Level | undefined = await this._levelsRepository.getById(entityId, transaction);

      return level !== undefined;
    }

    if (entityType === LESSON_OVERRIDE_ENTITY_TYPE) {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(entityId, transaction);

      return lesson !== undefined;
    }

    const step: Step | undefined = await this._stepsRepository.getById(entityId, transaction);

    return step !== undefined;
  }
}
