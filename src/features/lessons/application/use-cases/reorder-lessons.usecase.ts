/*
 * Funcionalidad: Caso de uso ReorderLessonsUseCase
 * Descripción: Reordena por lotes todas las lecciones de un módulo en una transacción con el plan de reordenamiento del dominio y una actualización SQL en dos fases; depende de ILessonRepository, IModuleRepository e ITransactionManager
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
import { InvalidLessonReorderError } from "@/features/lessons/domain/lessons.errors";
import { type ILessonRepository, LESSONS_REPOSITORY_TOKEN } from "@/features/lessons/domain/repositories/lessons.repository";
import { type Module } from "@/features/modules/domain/entities/module.entity";
import { ModuleNotFoundError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {ModuleNotFoundError} If the module does not exist
 * @throws {InvalidLessonReorderError} If the list is not exactly the lessons of the module, without duplicates
 */
@Injectable()
export class ReorderLessonsUseCase {
  public constructor(
    @Inject(LESSONS_REPOSITORY_TOKEN)
    private readonly _lessonsRepository: ILessonRepository,
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(moduleId: string, lessonIds: string[]): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const module: Module | undefined = await this._modulesRepository.getById(moduleId, transaction);

      if (!module) {
        throw new ModuleNotFoundError();
      }

      const current: OrderedItem[] = await this._lessonsRepository.getOrderedItemsInModule(module.id, transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, lessonIds, true);

      if (!plan) {
        throw new InvalidLessonReorderError();
      }

      await this._lessonsRepository.applyOrder(plan, transaction);
    });
  }
}
