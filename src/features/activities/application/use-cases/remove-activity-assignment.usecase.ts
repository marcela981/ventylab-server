/*
 * Funcionalidad: Caso de uso RemoveActivityAssignmentUseCase
 * Descripción: Retira (borrado lógico) la asignación de una actividad a un grupo; solo quien la asignó, o un ADMIN, puede hacerlo
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
import { RemoveActivityAssignmentCommand } from "@/features/activities/application/commands/remove-activity-assignment.command";
import { ActivityAssignmentNotFoundError, ActivityAssignmentNotOwnedError } from "@/features/activities/domain/activities.errors";
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import {
  ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IActivityAssignmentsRepository,
} from "@/features/activities/domain/repositories/activity-assignments.repository";
import { canManageAnyActivity } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivityAssignmentNotFoundError} If the assignment does not exist
 * @throws {ActivityAssignmentNotOwnedError} If the requester did not create the assignment and cannot manage any activity
 */
@Injectable()
export class RemoveActivityAssignmentUseCase {
  public constructor(
    @Inject(ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IActivityAssignmentsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RemoveActivityAssignmentCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const assignment: ActivityAssignment | undefined = await this._assignmentsRepository.getById(command.assignmentId, transaction);

      if (!assignment) {
        throw new ActivityAssignmentNotFoundError();
      }

      if (!canManageAnyActivity(command.requesterRole) && !assignment.isAssignedBy(command.performedBy)) {
        throw new ActivityAssignmentNotOwnedError();
      }

      assignment.remove(command.performedBy);

      await this._assignmentsRepository.save(assignment, transaction);

      return assignment.getEvents();
    });

    this._eventBus.publish(events);
  }
}
