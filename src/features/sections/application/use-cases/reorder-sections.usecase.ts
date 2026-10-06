/*
 * Funcionalidad: Caso de uso ReorderSectionsUseCase
 * Descripción: Reordena secciones por lotes en una transacción con el plan de reordenamiento del dominio y una actualización SQL en dos fases; depende de ISectionRepository e ITransactionManager
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
import { type ISectionRepository, SECTIONS_REPOSITORY_TOKEN } from "@/features/sections/domain/repositories/sections.repository";
import { InvalidSectionReorderError } from "@/features/sections/domain/sections.errors";

/**
 * @throws {InvalidSectionReorderError} If the list is empty, has duplicates or contains unknown section IDs
 */
@Injectable()
export class ReorderSectionsUseCase {
  public constructor(
    @Inject(SECTIONS_REPOSITORY_TOKEN)
    private readonly _sectionsRepository: ISectionRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(sectionIds: string[]): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const current: OrderedItem[] = await this._sectionsRepository.getOrderedItems(transaction);
      const plan: ReorderEntry[] | undefined = buildReorderPlan(current, sectionIds, false);

      if (!plan) {
        throw new InvalidSectionReorderError();
      }

      await this._sectionsRepository.applyOrder(plan, transaction);
    });
  }
}
