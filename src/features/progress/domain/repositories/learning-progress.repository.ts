/*
 * Funcionalidad: Puerto de repositorio LEARNING_PROGRESS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILearningProgressRepository (estructura publicada y hechos de completitud por alcance, destino de una vista de página, vistas de página idempotentes y completitud de lecciones) y su token de inyección. v1.1: savePageView indica si creó la fila (primera vista) y markLessonCompleted si hizo la transición a completada (escrituras condicionales, sin leer antes de escribir)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import {
  type PageViewSnapshot,
  type PageViewTarget,
  type PageViewWrite,
  type ProgressScope,
  type SavedPageView,
  type ProgressSource,
} from "@/features/progress/domain/read-models/learning-progress.read-model";

export const LEARNING_PROGRESS_REPOSITORY_TOKEN: unique symbol = Symbol("LEARNING_PROGRESS_REPOSITORY_TOKEN");

export interface ILearningProgressRepository {
  getProgressSource(userId: string, scope: ProgressScope): Promise<ProgressSource | undefined>;
  getPageViewTarget(pageId: string): Promise<{ target: PageViewTarget; chain: ContentStatusChain } | undefined>;
  getPageView(userId: string, pageId: string, transaction?: unknown): Promise<PageViewSnapshot | undefined>;
  savePageView(userId: string, pageId: string, write: PageViewWrite, transaction?: unknown): Promise<SavedPageView>;
  getLessonFacts(userId: string, lessonIds: string[], transaction?: unknown): Promise<LessonCompletionFact[]>;
  // True only for the call that turned the lesson completed; concurrent callers get false.
  markLessonCompleted(userId: string, lessonId: string, completedAt: Date, transaction?: unknown): Promise<boolean>;
}
