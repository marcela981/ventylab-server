/*
 * Funcionalidad: Caso de uso UpsertScoreUseCase
 * Descripción: Registra o actualiza la calificación identificada por profesor, estudiante, tipo y elemento; valida el rango del puntaje y que el estudiante exista, y conserva los comentarios previos si no se envían nuevos; devuelve el ID de la calificación
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
import { UpsertScoreCommand } from "@/features/scores/application/commands/upsert-score.command";
import { Score } from "@/features/scores/domain/entities/score.entity";
import { type IScoresRepository, SCORES_REPOSITORY_TOKEN } from "@/features/scores/domain/repositories/scores.repository";
import { InvalidScorePointsError } from "@/features/scores/domain/scores.errors";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {InvalidScorePointsError} If the points are outside 0 and the maximum points
 * @throws {UserNotFoundError} If the student does not exist
 */
@Injectable()
export class UpsertScoreUseCase {
  public constructor(
    @Inject(SCORES_REPOSITORY_TOKEN)
    private readonly _scoresRepository: IScoresRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: UpsertScoreCommand): Promise<string> {
    if (command.points < 0 || command.points > command.maxPoints) {
      throw new InvalidScorePointsError(command.maxPoints);
    }

    const { id, events }: { id: string; events: DomainEvent[] } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ id: string; events: DomainEvent[] }> => {
        const student: User | undefined = await this._usersRepository.getById(command.userId, transaction);

        if (!student) {
          throw new UserNotFoundError();
        }

        const existing: Score | undefined = await this._scoresRepository.getByKey(
          { graderId: command.graderId, userId: command.userId, entityType: command.entityType, entityId: command.entityId },
          transaction,
        );

        const score: Score = existing ?? Score.create({
          userId: command.userId,
          graderId: command.graderId,
          entityType: command.entityType,
          entityId: command.entityId,
          points: command.points,
          maxPoints: command.maxPoints,
          comments: command.comments,
        });

        if (existing) {
          existing.regrade({ points: command.points, maxPoints: command.maxPoints, comments: command.comments }, command.graderId);
        }

        await this._scoresRepository.save(score, transaction);

        return { id: score.id, events: score.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return id;
  }
}
