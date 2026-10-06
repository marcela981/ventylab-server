/*
 * Funcionalidad: Caso de uso DeleteScoreUseCase
 * Descripción: Elimina una calificación; solo el profesor que la asignó puede hacerlo
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { DeleteScoreCommand } from "@/features/scores/application/commands/delete-score.command";
import { type Score } from "@/features/scores/domain/entities/score.entity";
import { type IScoresRepository, SCORES_REPOSITORY_TOKEN } from "@/features/scores/domain/repositories/scores.repository";
import { ScoreNotFoundError, ScoreNotOwnedError } from "@/features/scores/domain/scores.errors";

/**
 * @throws {ScoreNotFoundError} If the score does not exist
 * @throws {ScoreNotOwnedError} If the requester is not the teacher who assigned the score
 */
@Injectable()
export class DeleteScoreUseCase {
  public constructor(
    @Inject(SCORES_REPOSITORY_TOKEN)
    private readonly _scoresRepository: IScoresRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: DeleteScoreCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const score: Score | undefined = await this._scoresRepository.getById(command.scoreId, transaction);

      if (!score) {
        throw new ScoreNotFoundError();
      }

      if (!score.isGradedBy(command.performedBy)) {
        throw new ScoreNotOwnedError();
      }

      score.delete(command.performedBy);

      await this._scoresRepository.delete(score, transaction);

      return score.getEvents();
    });

    this._eventBus.publish(events);
  }
}
