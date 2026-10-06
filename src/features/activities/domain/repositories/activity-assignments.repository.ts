/*
 * Funcionalidad: Repositorio de asignaciones de actividades
 * Descripción: Contrato y token del repositorio del agregado ActivityAssignment (búsqueda por id o por actividad y grupo, asignación activa para los grupos de un estudiante, listado con grupo y guardado)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { type ActivityAssignmentView, type AssignmentWindowView } from "@/features/activities/domain/read-models/activity.read-model";

export const ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN: unique symbol = Symbol("ACTIVITY_ASSIGNMENTS_REPOSITORY_TOKEN");

export interface IActivityAssignmentsRepository {
  getById(assignmentId: string, transaction?: unknown): Promise<ActivityAssignment | undefined>;
  getByActivityAndGroup(activityId: string, groupId: string, transaction?: unknown): Promise<ActivityAssignment | undefined>;
  getActiveForGroups(activityId: string, groupIds: string[], transaction?: unknown): Promise<AssignmentWindowView | undefined>;
  getActiveByActivity(activityId: string): Promise<ActivityAssignmentView[]>;
  save(assignment: ActivityAssignment, transaction?: unknown): Promise<void>;
}
