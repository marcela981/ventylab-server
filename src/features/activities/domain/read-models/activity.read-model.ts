/*
 * Funcionalidad: Modelos de lectura de actividades
 * Descripción: Vistas de solo lectura de actividades (listado de estudiante y de docente, detalle), asignaciones con su grupo y entregas con actividad, estudiante y calificador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { type SubmissionStatusValue } from "@/features/activities/domain/value-objects/submission-status";

export interface AssignmentWindowView {
  readonly id?: string;
  readonly groupId: string;
  readonly dueDate?: Date;
  readonly visibleFrom?: Date;
}

export interface SubmissionBriefView {
  readonly id: string;
  readonly status: SubmissionStatusValue;
  readonly score?: number;
  readonly maxScore?: number;
  readonly submittedAt?: Date;
  readonly gradedAt?: Date;
}

export interface ActivityListItemView {
  readonly activity: Activity;
  readonly assignments: AssignmentWindowView[];
  readonly submissions?: SubmissionBriefView[];
  readonly submissionsCount?: number;
}

export interface ActivityDetailView {
  readonly activity: Activity;
  readonly assignments: ActivityAssignment[];
}

export interface AssignmentGroupView {
  readonly id: string;
  readonly name: string;
  readonly parentGroupId?: string;
  readonly depth: number;
}

export interface ActivityAssignmentView {
  readonly assignment: ActivityAssignment;
  readonly group?: AssignmentGroupView;
}

export interface SubmissionActivityView {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly instructions?: string;
  readonly dueDate?: Date;
  readonly maxScore: number;
}

export interface SubmissionPersonView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface ActivitySubmissionView {
  readonly submission: ActivitySubmission;
  readonly activity?: SubmissionActivityView;
  readonly student?: SubmissionPersonView;
  readonly grader?: SubmissionPersonView;
}
