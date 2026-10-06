/*
 * Funcionalidad: Caso de uso PublishActivityUseCase
 * Descripción: Publica una actividad (sin efecto si ya estaba publicada); solo su creador, o un ADMIN, puede hacerlo
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
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { PublishActivityCommand } from "@/features/activities/application/commands/publish-activity.command";
import { ActivityNotFoundError, ActivityNotOwnedError } from "@/features/activities/domain/activities.errors";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import { canManageAnyActivity } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivityNotFoundError} If the activity does not exist
 * @throws {ActivityNotOwnedError} If the requester is not the creator and cannot manage any activity
 */
@Injectable()
export class PublishActivityUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: PublishActivityCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const activity: Activity | undefined = await this._activitiesRepository.getById(command.activityId, transaction);

      if (!activity) {
        throw new ActivityNotFoundError();
      }

      if (!canManageAnyActivity(command.requesterRole) && !activity.isOwnedBy(command.performedBy)) {
        throw new ActivityNotOwnedError();
      }

      if (activity.isPublished) {
        return [];
      }

      activity.publish(command.performedBy);

      await this._activitiesRepository.save(activity, transaction);

      return activity.getEvents();
    });

    this._eventBus.publish(events);
  }
}
