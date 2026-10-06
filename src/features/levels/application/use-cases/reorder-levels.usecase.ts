/*
 * Funcionalidad: Caso de uso ReorderLevelsUseCase
 * Descripción: Reordena niveles por lotes en una transacción: valida la lista con el plan de reordenamiento del dominio y aplica el nuevo orden con una actualización SQL en dos fases; depende de IEventBus, ITransactionManager, ILevelRepository
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
import { ReorderLevelsCommand } from "@/features/levels/application/commands/reorder-levels.command";
import { LevelsReorderedEvent } from "@/features/levels/domain/events/level.events";
import { InvalidLevelReorderError } from "@/features/levels/domain/levels.errors";
import { type ILevelRepository, LEVELS_REPOSITORY_TOKEN } from "@/features/levels/domain/repositories/levels.repository";

/**
 * @throws {InvalidLevelReorderError} If the list is empty, has duplicates or contains unknown level IDs
 */
@Injectable()
export class ReorderLevelsUseCase {
  public constructor(
    @Inject(LEVELS_REPOSITORY_TOKEN)
    private readonly _levelsRepository: ILevelRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: ReorderLevelsCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const current: OrderedItem[] = await this._levelsRepository.getOrderedItems(transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, command.levelIds, false);

      if (!plan) {
        throw new InvalidLevelReorderError();
      }

      await this._levelsRepository.applyOrder(plan, transaction);

      const requestedIds: Set<string> = new Set(command.levelIds);

      this._eventBus.publish([
        new LevelsReorderedEvent({
          previousOrder: Object.fromEntries(current.filter((item: OrderedItem) => requestedIds.has(item.id)).map((item: OrderedItem) => [item.id, item.order])),
          newOrder: Object.fromEntries(plan.map((entry: ReorderEntry) => [entry.id, entry.order])),
          performedBy: command.performedBy,
        }),
      ]);
    });
  }
}
