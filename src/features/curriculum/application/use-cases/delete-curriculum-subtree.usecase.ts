/*
 * Funcionalidad: Caso de uso DeleteCurriculumSubtreeUseCase
 * Descripción: Elimina físicamente, en una sola transacción y de hijos a padres, el subárbol de una sección, nivel, módulo, lección o página cuando no tiene datos de estudiantes; si los tiene exige archivarlo. Devuelve false cuando el nodo no existe para que cada feature lance su propio error 404
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable, Logger } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { DeleteCurriculumSubtreeCommand } from "@/features/curriculum/application/commands/delete-curriculum-subtree.command";
import { InspectCurriculumSubtreeUseCase } from "@/features/curriculum/application/use-cases/inspect-curriculum-subtree.usecase";
import { CurriculumNodeHasStudentDataError } from "@/features/curriculum/domain/curriculum.errors";
import { type CurriculumDeleteInspection } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import {
  CURRICULUM_SUBTREE_REPOSITORY_TOKEN,
  type ICurriculumSubtreeRepository,
} from "@/features/curriculum/domain/repositories/curriculum-subtree.repository";
import { ARCHIVE_REQUIRED_DECISION } from "@/features/curriculum/domain/services/delete-guard";

/**
 * @throws {CurriculumNodeHasStudentDataError} If the node or any descendant has student data
 */
@Injectable()
export class DeleteCurriculumSubtreeUseCase {
  private readonly _logger: Logger = new Logger(DeleteCurriculumSubtreeUseCase.name);

  public constructor(
    @Inject(CURRICULUM_SUBTREE_REPOSITORY_TOKEN)
    private readonly _subtreeRepository: ICurriculumSubtreeRepository,
    private readonly _inspectCurriculumSubtreeUseCase: InspectCurriculumSubtreeUseCase,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: DeleteCurriculumSubtreeCommand): Promise<boolean> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<boolean> => {
      const inspection: CurriculumDeleteInspection | undefined = await this._inspectCurriculumSubtreeUseCase.execute(command.kind, command.id, transaction);

      if (!inspection) {
        return false;
      }

      if (inspection.decision === ARCHIVE_REQUIRED_DECISION) {
        throw new CurriculumNodeHasStudentDataError();
      }

      await this._subtreeRepository.deleteSubtree(inspection.subtree, transaction);

      this._logger.log(
        `Deleted ${command.kind} ${command.id} subtree (${inspection.subtree.levelIds.length} levels, ${inspection.subtree.moduleIds.length} modules, ` +
          `${inspection.subtree.lessonIds.length} lessons, ${inspection.subtree.pageIds.length} pages) by ${command.performedBy ?? "unknown"}`,
      );

      return true;
    });
  }
}
