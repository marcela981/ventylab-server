/*
 * Funcionalidad: Puerto de repositorio PROGRESS_ANALYTICS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IProgressAnalyticsRepository de lecturas por lotes para analítica (estructura publicada con los hechos de completitud de varios usuarios a la vez y lecciones completadas por un usuario en un rango), sus modelos de lectura y su token de inyección
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type ProgressStructure } from "@/features/progress/domain/read-models/learning-progress.read-model";

export const PROGRESS_ANALYTICS_REPOSITORY_TOKEN: unique symbol = Symbol("PROGRESS_ANALYTICS_REPOSITORY_TOKEN");

export interface UsersProgressSource {
  readonly structure: ProgressStructure;
  readonly factsByUser: ReadonlyMap<string, LessonCompletionFact[]>;
}

export interface LessonCompletionActivity {
  readonly lessonId: string;
  readonly lessonTitle: string;
  readonly moduleId: string;
  readonly completedAt: Date;
}

export interface IProgressAnalyticsRepository {
  getProgressSourceForUsers(userIds: readonly string[]): Promise<UsersProgressSource>;
  getLessonCompletionsOfUser(userId: string, from: Date, to: Date, limit: number): Promise<LessonCompletionActivity[]>;
}
