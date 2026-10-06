/*
 * Funcionalidad: Repositorio de entregas de actividades
 * Descripción: Contrato y token del repositorio del agregado ActivitySubmission y de sus vistas de lectura (por id, por actividad y usuario, del estudiante y de una actividad)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type ActivitySubmissionView } from "@/features/activities/domain/read-models/activity.read-model";

export const ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN: unique symbol = Symbol("ACTIVITY_SUBMISSIONS_REPOSITORY_TOKEN");

export interface IActivitySubmissionsRepository {
  getById(submissionId: string, transaction?: unknown): Promise<ActivitySubmission | undefined>;
  getByActivityAndUser(activityId: string, userId: string, transaction?: unknown): Promise<ActivitySubmission | undefined>;
  getViewById(submissionId: string): Promise<ActivitySubmissionView | undefined>;
  getViewByActivityAndUser(activityId: string, userId: string): Promise<ActivitySubmissionView | undefined>;
  getViewsByUser(userId: string): Promise<ActivitySubmissionView[]>;
  getViewsByActivity(activityId: string, groupId?: string): Promise<ActivitySubmissionView[]>;
  save(submission: ActivitySubmission, transaction?: unknown): Promise<void>;
  delete(submission: ActivitySubmission, transaction?: unknown): Promise<void>;
}
