/*
 * Funcionalidad: Mapper de presentación de actividades
 * Descripción: Convierte agregados y vistas de actividades, asignaciones y entregas a sus DTOs de respuesta, y los DTOs de edición a cambios de dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type Activity, type ActivityChanges } from "@/features/activities/domain/entities/activity.entity";
import {
  type ActivityAssignmentView,
  type ActivityDetailView,
  type ActivityListItemView,
  type ActivitySubmissionView,
  type AssignmentGroupView,
  type AssignmentWindowView,
  type SubmissionBriefView,
  type SubmissionPersonView,
} from "@/features/activities/domain/read-models/activity.read-model";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";
import { type UpdateActivityDTO } from "@/features/activities/presentation/dtos/activity-request.dto";
import { ActivitySubmissionDTO, SubmissionActivityDTO, SubmissionPersonDTO } from "@/features/activities/presentation/dtos/activity-submission.dto";
import {
  ActivityAssignmentDTO,
  ActivityDetailDTO,
  ActivityDTO,
  type ActivityDTOFields,
  ActivityListItemDTO,
  AssignmentGroupDTO,
  AssignmentWindowDTO,
  SubmissionBriefDTO,
} from "@/features/activities/presentation/dtos/activity.dto";

export class ActivitiesMapper {
  public static toChanges(dto: UpdateActivityDTO): ActivityChanges {
    return {
      title: dto.title,
      description: dto.description,
      instructions: dto.instructions,
      type: dto.type as ActivityTypeValue | undefined,
      maxScore: dto.maxScore,
      timeLimit: dto.timeLimit,
      dueDate: dto.dueDate,
      isActive: dto.isActive,
    };
  }

  public static toDTO(activity: Activity): ActivityDTO {
    return new ActivityDTO(ActivitiesMapper._fields(activity));
  }

  public static toDTOList(activities: Activity[]): ActivityDTO[] {
    return activities.map((activity: Activity) => ActivitiesMapper.toDTO(activity));
  }

  public static toListItemDTO(view: ActivityListItemView): ActivityListItemDTO {
    return new ActivityListItemDTO({
      ...ActivitiesMapper._fields(view.activity),
      assignments: view.assignments.map(
        (window: AssignmentWindowView) =>
          new AssignmentWindowDTO({
            id: window.id ?? null,
            groupId: window.groupId,
            dueDate: window.dueDate ?? null,
            visibleFrom: window.visibleFrom ?? null,
          }),
      ),
      submissions: view.submissions
        ? view.submissions.map(
          (submission: SubmissionBriefView) =>
            new SubmissionBriefDTO({
              id: submission.id,
              status: submission.status,
              score: submission.score ?? null,
              maxScore: submission.maxScore ?? null,
              submittedAt: submission.submittedAt ?? null,
              gradedAt: submission.gradedAt ?? null,
            }),
        )
        : null,
      submissionsCount: view.submissionsCount ?? null,
    });
  }

  public static toDetailDTO(view: ActivityDetailView): ActivityDetailDTO {
    return new ActivityDetailDTO({
      ...ActivitiesMapper._fields(view.activity),
      assignments: view.assignments.map((assignment: ActivityAssignment) => ActivitiesMapper.toAssignmentDTO(assignment)),
    });
  }

  public static toAssignmentDTO(assignment: ActivityAssignment, group?: AssignmentGroupView): ActivityAssignmentDTO {
    return new ActivityAssignmentDTO({
      id: assignment.id,
      activityId: assignment.activityId,
      groupId: assignment.groupId,
      assignedBy: assignment.assignedBy,
      visibleFrom: assignment.visibleFrom ?? null,
      dueDate: assignment.dueDate ?? null,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      group: group
        ? new AssignmentGroupDTO({ id: group.id, name: group.name, parentGroupId: group.parentGroupId ?? null, depth: group.depth })
        : null,
    });
  }

  public static toAssignmentViewDTOList(views: ActivityAssignmentView[]): ActivityAssignmentDTO[] {
    return views.map((view: ActivityAssignmentView) => ActivitiesMapper.toAssignmentDTO(view.assignment, view.group));
  }

  public static toSubmissionDTO(submission: ActivitySubmission, view?: ActivitySubmissionView): ActivitySubmissionDTO {
    return new ActivitySubmissionDTO({
      id: submission.id,
      activityId: submission.activityId,
      userId: submission.userId,
      groupId: submission.groupId ?? null,
      status: submission.status,
      content: submission.content ?? null,
      submittedAt: submission.submittedAt ?? null,
      score: submission.score ?? null,
      maxScore: submission.maxScore ?? null,
      feedback: submission.feedback ?? null,
      gradedBy: submission.gradedBy ?? null,
      gradedAt: submission.gradedAt ?? null,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      activity: view?.activity
        ? new SubmissionActivityDTO({
          id: view.activity.id,
          title: view.activity.title,
          type: view.activity.type,
          instructions: view.activity.instructions ?? null,
          dueDate: view.activity.dueDate ?? null,
          maxScore: view.activity.maxScore,
        })
        : null,
      student: ActivitiesMapper._toPersonDTO(view?.student),
      grader: ActivitiesMapper._toPersonDTO(view?.grader),
    });
  }

  public static toSubmissionViewDTO(view: ActivitySubmissionView): ActivitySubmissionDTO {
    return ActivitiesMapper.toSubmissionDTO(view.submission, view);
  }

  public static toSubmissionViewDTOList(views: ActivitySubmissionView[]): ActivitySubmissionDTO[] {
    return views.map((view: ActivitySubmissionView) => ActivitiesMapper.toSubmissionViewDTO(view));
  }

  private static _toPersonDTO(person?: SubmissionPersonView): SubmissionPersonDTO | null {
    return person ? new SubmissionPersonDTO({ id: person.id, name: person.name ?? null, email: person.email }) : null;
  }

  private static _fields(activity: Activity): ActivityDTOFields {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description ?? null,
      instructions: activity.instructions ?? null,
      type: activity.type,
      maxScore: activity.maxScore,
      timeLimit: activity.timeLimit ?? null,
      dueDate: activity.dueDate ?? null,
      isPublished: activity.isPublished,
      isActive: activity.isActive,
      createdBy: activity.createdBy,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }
}
