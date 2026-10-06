/*
 * Funcionalidad: Puerto de repositorio LESSON_PROGRESS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILessonProgressRepository y su token de inyección para la feature de lecciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionRecord, type LessonCompletionResult } from "@/features/lessons/domain/read-models/lesson-progress.read-model";

export const LESSON_PROGRESS_REPOSITORY_TOKEN: unique symbol = Symbol("LESSON_PROGRESS_REPOSITORY_TOKEN");

export interface ILessonProgressRepository {
  markCompleted(
    { userId, lessonId, moduleId, timeSpent }: { userId: string; lessonId: string; moduleId: string; timeSpent: number },
    transaction?: unknown,
  ): Promise<LessonCompletionResult>;
  recordAccess(
    { userId, lessonId, moduleId }: { userId: string; lessonId: string; moduleId: string },
    transaction?: unknown,
  ): Promise<LessonCompletionRecord>;
}
