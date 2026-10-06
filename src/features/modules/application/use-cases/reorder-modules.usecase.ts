/*
 * Funcionalidad: Caso de uso ReorderModulesUseCase
 * Descripción: Reordena por lotes todos los módulos de un nivel en una transacción con el plan de reordenamiento del dominio y una actualización SQL en dos fases; depende de IModuleRepository, ILevelRepository e ITransactionManager
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
import { type Level } from "@/features/levels/domain/entities/level.entity";
import { LevelNotFoundError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";
import { InvalidModuleReorderError } from "@/features/modules/domain/modules.errors";
import { type IModuleRepository, MODULES_REPOSITORY_TOKEN } from "@/features/modules/domain/repositories/modules.repository";

/**
 * @throws {LevelNotFoundError} If the level does not exist
 * @throws {InvalidModuleReorderError} If the list is not exactly the modules of the level, without duplicates
 */
@Injectable()
export class ReorderModulesUseCase {
  public constructor(
    @Inject(MODULES_REPOSITORY_TOKEN)
    private readonly _modulesRepository: IModuleRepository,
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(levelId: string, moduleIds: string[]): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const level: Level | undefined = await this._levelsRepository.getById(levelId, transaction);

      if (!level) {
        throw new LevelNotFoundError();
      }

      const current: OrderedItem[] = await this._modulesRepository.getOrderedItemsInLevel(level.id, transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, moduleIds, true);

      if (!plan) {
        throw new InvalidModuleReorderError();
      }

      await this._modulesRepository.applyOrder(plan, transaction);
    });
  }
}
