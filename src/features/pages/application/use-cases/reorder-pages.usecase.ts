/*
 * Funcionalidad: Caso de uso ReorderPagesUseCase
 * Descripción: Reordena por lotes todas las páginas de una lección en una transacción reutilizando sus posiciones dentro del módulo (restricción única moduleId, order) y una actualización SQL en dos fases; depende de IPageRepository, ILessonRepository e ITransactionManager
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { buildReorderPlan, type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";
import { LessonNotFoundError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { InvalidPageReorderError } from "@/features/pages/domain/pages.errors";
import { type IPageRepository, PAGES_REPOSITORY_TOKEN } from "@/features/pages/domain/repositories/pages.repository";

/**
 * @throws {LessonNotFoundError} If the lesson does not exist
 * @throws {InvalidPageReorderError} If the list is not exactly the pages of the lesson, without duplicates
 */
@Injectable()
export class ReorderPagesUseCase {
  public constructor(
    @Inject(PAGES_REPOSITORY_TOKEN)
    private readonly _pagesRepository: IPageRepository,
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(lessonId: string, pageIds: string[]): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const lesson: Lesson | undefined = await this._lessonsRepository.getById(lessonId, transaction);

      if (!lesson) {
        throw new LessonNotFoundError();
      }

      const current: OrderedItem[] = await this._pagesRepository.getOrderedItemsInLesson(lesson.id, transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, pageIds, true);

      if (!plan) {
        throw new InvalidPageReorderError();
      }

      await this._pagesRepository.applyOrder(plan, transaction);
    });
  }
}
