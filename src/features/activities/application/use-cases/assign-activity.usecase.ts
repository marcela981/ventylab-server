/*
 * Funcionalidad: Caso de uso AssignActivityUseCase
 * Descripción: Asigna una actividad activa a un grupo activo, o actualiza la asignación existente para ese par (ventana de visibilidad, fecha límite, estado y responsable); solo el creador de la actividad, o un ADMIN, puede asignarla
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
import { AssignActivityCommand } from "@/features/activities/application/commands/assign-activity.command";
import { ActivityGroupNotFoundError, ActivityNotFoundError, ActivityNotOwnedError } from "@/features/activities/domain/activities.errors";
import { ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IActivityAssignmentsRepository,
} from "@/features/activities/domain/repositories/activity-assignments.repository";
import {
  ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN,
  type IActivityGroupMembershipRepository,
} from "@/features/activities/domain/repositories/activity-group-membership.repository";
import { canManageAnyActivity } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {ActivityNotFoundError} If the activity does not exist or is inactive
 * @throws {ActivityNotOwnedError} If the requester is not the creator and cannot manage any activity
 * @throws {ActivityGroupNotFoundError} If the group does not exist or is inactive
 */
@Injectable()
export class AssignActivityUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
    @Inject(ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN)
    private readonly _assignmentsRepository: IActivityAssignmentsRepository,
    @Inject(ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN)
    private readonly _groupMembershipRepository: IActivityGroupMembershipRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: AssignActivityCommand): Promise<string> {
    const { assignmentId, events } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ assignmentId: string; events: DomainEvent[] }> => {
        const activity: Activity | undefined = await this._activitiesRepository.getById(command.activityId, transaction);

        if (!activity || !activity.isActive) {
          throw new ActivityNotFoundError();
        }

        if (!canManageAnyActivity(command.requesterRole) && !activity.isOwnedBy(command.performedBy)) {
          throw new ActivityNotOwnedError();
        }

        if (!(await this._groupMembershipRepository.isActiveGroup(command.groupId, transaction))) {
          throw new ActivityGroupNotFoundError();
        }

        const existing: ActivityAssignment | undefined = await this._assignmentsRepository.getByActivityAndGroup(
          command.activityId,
          command.groupId,
          transaction,
        );

        const assignment: ActivityAssignment = existing ?? ActivityAssignment.create({
          activityId: command.activityId,
          groupId: command.groupId,
          assignedBy: command.performedBy,
          visibleFrom: command.visibleFrom ?? undefined,
          dueDate: command.dueDate ?? undefined,
          isActive: command.isActive,
        });

        if (existing) {
          existing.reassign({ visibleFrom: command.visibleFrom, dueDate: command.dueDate, isActive: command.isActive }, command.performedBy);
        }

        await this._assignmentsRepository.save(assignment, transaction);

        return { assignmentId: assignment.id, events: assignment.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return assignmentId;
  }
}
