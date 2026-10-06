/*
 * Funcionalidad: Caso de uso RecordLessonAccessUseCase
 * Descripción: Ejecuta la operación RecordLessonAccess de la feature de lecciones; depende de ITransactionManager, ILessonProgressRepository, ILessonRepository
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { RecordLessonAccessCommand } from "@/features/lessons/application/commands/record-lesson-access.command";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type LessonCompletionRecord } from "@/features/lessons/domain/read-models/lesson-progress.read-model";
import { type ILessonProgressRepository, LESSON_PROGRESS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lesson-progress.repository";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 */
@Injectable()
export class RecordLessonAccessUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY_TOKEN)
    private readonly _lessonProgressRepository: ILessonProgressRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: RecordLessonAccessCommand): Promise<LessonCompletionRecord> {
    const lesson: Lesson | undefined = await this._lessonsRepository.getById(command.lessonId);

    if (!lesson) {
      throw new LessonNotFoundError();
    }

    return await this._transactionManager.run(
      async (transaction: unknown): Promise<LessonCompletionRecord> =>
        await this._lessonProgressRepository.recordAccess({ userId: command.userId, lessonId: lesson.id, moduleId: lesson.moduleId }, transaction),
    );
  }
}
