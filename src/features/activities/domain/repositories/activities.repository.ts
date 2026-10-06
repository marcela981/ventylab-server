/*
 * Funcionalidad: Repositorio de actividades
 * Descripción: Contrato y token del repositorio del agregado Activity y de sus vistas de lectura (listado del estudiante por grupos, listado del docente, detalle y catálogo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { type ActivityDetailView, type ActivityListItemView } from "@/features/activities/domain/read-models/activity.read-model";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";

export const ACTIVITIES_REPOSITORY_TOKEN: unique symbol = Symbol("ACTIVITIES_REPOSITORY_TOKEN");

export interface GetActivityCatalogQuery {
  type?: ActivityTypeValue;
  publishedOnly: boolean;
}

export interface IActivitiesRepository {
  getById(activityId: string, transaction?: unknown): Promise<Activity | undefined>;
  getDetail(activityId: string): Promise<ActivityDetailView | undefined>;
  getStudentActivities(userId: string, groupIds: string[]): Promise<ActivityListItemView[]>;
  getTeacherActivities(createdBy: string): Promise<ActivityListItemView[]>;
  getCatalog(query: GetActivityCatalogQuery): Promise<Activity[]>;
  save(activity: Activity, transaction?: unknown): Promise<void>;
}
