/*
 * Funcionalidad: Caso de uso CreateActivityUseCase
 * Descripción: Crea una actividad sin publicar (puntaje máximo 100 por defecto) a nombre del docente solicitante y devuelve su identificador
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
import { CreateActivityCommand } from "@/features/activities/application/commands/create-activity.command";
import { Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";

@Injectable()
export class CreateActivityUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: CreateActivityCommand): Promise<string> {
    const activity: Activity = Activity.create({
      title: command.title,
      description: command.description,
      instructions: command.instructions,
      type: command.type,
      maxScore: command.maxScore,
      timeLimit: command.timeLimit,
      dueDate: command.dueDate,
      createdBy: command.performedBy,
    });

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      await this._activitiesRepository.save(activity, transaction);

      return activity.getEvents();
    });

    this._eventBus.publish(events);

    return activity.id;
  }
}
