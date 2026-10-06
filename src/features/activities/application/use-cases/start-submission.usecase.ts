/*
 * Funcionalidad: Caso de uso StartSubmissionUseCase
 * Descripción: Inicia u obtiene la entrega de un estudiante: rechaza intentos ya completados (SUBMITTED o GRADED), exige actividad activa y publicada, y si el estudiante pertenece a grupos exige una asignación activa y visible a uno de ellos; los estudiantes sin grupo también pueden entregar
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
import { StartSubmissionCommand } from "@/features/activities/application/commands/start-submission.command";
import {
  ActivityNotAssignedToGroupError,
  ActivityNotAvailableError,
  ActivityNotYetVisibleError,
  ActivitySubmissionAlreadyCompletedError,
  StudentRoleRequiredError,
} from "@/features/activities/domain/activities.errors";
import { ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { type AssignmentWindowView } from "@/features/activities/domain/read-models/activity.read-model";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import {
  ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN,
  type IActivityAssignmentsRepository,
} from "@/features/activities/domain/repositories/activity-assignments.repository";
import {
  ACTIVITY_GROUP_MEMBERSHIP_REPOSITORY_TOKEN,
  type IActivityGroupMembershipRepository,
} from "@/features/activities/domain/repositories/activity-group-membership.repository";
import {
  ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN,
  type IActivitySubmissionsRepository,
} from "@/features/activities/domain/repositories/activity-submissions.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";

/**
 * @throws {StudentRoleRequiredError} If the requester is not a student
 * @throws {ActivitySubmissionAlreadyCompletedError} If the student already submitted or was graded for this activity
 * @throws {ActivityNotAvailableError} If the activity does not exist, is inactive or is unpublished
 * @throws {ActivityNotAssignedToGroupError} If the student belongs to groups and none has the activity assigned
 * @throws {ActivityNotYetVisibleError} If the assignment is not visible yet
 */
@Injectable()
export class StartSubmissionUseCase {
  public constructor(
    @Inject(ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly _submissionsRepository: IActivitySubmissionsRepository,
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

  public async execute(command: StartSubmissionCommand): Promise<ActivitySubmission> {
    const { activityId, userId } = command;

    if (!isStudentRole(command.requesterRole)) {
      throw new StudentRoleRequiredError();
    }

    const existing: ActivitySubmission | undefined = await this._submissionsRepository.getByActivityAndUser(activityId, userId);

    if (existing?.isCompleted()) {
      throw new ActivitySubmissionAlreadyCompletedError();
    }

    const activity: Activity | undefined = await this._activitiesRepository.getById(activityId);

    if (!activity || !activity.isActive || !activity.isPublished) {
      throw new ActivityNotAvailableError();
    }

    const groupId: string | undefined = await this._resolveGroupId(activityId, userId);

    if (existing) {
      return existing;
    }

    const submission: ActivitySubmission = ActivitySubmission.start({ activityId, userId, groupId, maxScore: activity.maxScore });

    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      await this._submissionsRepository.save(submission, transaction);

      return submission.getEvents();
    });

    this._eventBus.publish(events);

    return submission;
  }

  private async _resolveGroupId(activityId: string, userId: string): Promise<string | undefined> {
    const groupIds: string[] = await this._groupMembershipRepository.getGroupIdsForUser(userId);

    if (groupIds.length === 0) {
      return undefined;
    }

    const assignment: AssignmentWindowView | undefined = await this._assignmentsRepository.getActiveForGroups(activityId, groupIds);

    if (!assignment) {
      throw new ActivityNotAssignedToGroupError();
    }

    if (assignment.visibleFrom && new Date() < assignment.visibleFrom) {
      throw new ActivityNotYetVisibleError();
    }

    return assignment.groupId;
  }
}
