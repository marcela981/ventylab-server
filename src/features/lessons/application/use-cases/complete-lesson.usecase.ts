/*
 * Funcionalidad: Caso de uso CompleteLessonUseCase
 * Descripción: Ejecuta la operación CompleteLesson de la feature de lecciones; depende de ITransactionManager, ILessonProgressRepository, ILessonRepository, IUserRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { CompleteLessonCommand } from "@/features/lessons/application/commands/complete-lesson.command";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonCompletionResult } from "@/features/lessons/domain/read-models/lesson-progress.read-model";
import { type ILessonProgressRepository, LESSON_PROGRESS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-progress.repository";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the user does not exist
 * @throws {LessonNotFoundError} If the lesson does not exist
 */
@Injectable()
export class CompleteLessonUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY_TOKEN)
    private readonly _lessonProgressRepository: ILessonProgressRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: CompleteLessonCommand): Promise<LessonCompletionResult> {
    const user: User | undefined = await this._usersRepository.getById(command.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId);

    if (!lesson) {
      throw new LessonNotFoundError();
    }

    return await this._transactionManager.run(
      async (transaction: unknown): Promise<LessonCompletionResult> =>
        await this._lessonProgressRepository.markCompleted(
          { userId: user.id, lessonId: lesson.id, moduleId: lesson.moduleId, timeSpent: command.timeSpent },
          transaction,
        ),
    );
  }
}
