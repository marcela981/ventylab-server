/*
 * Funcionalidad: Puerto de repositorio LESSON_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILessonQueriesRepository y su token de inyección para la feature de lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import {
  type LessonContentView,
  type LessonDetail,
  type LessonNeighbor,
  type LessonStepItem,
} from "@/features/lessons/domain/read-models/lesson-views.read-model";

export const LESSON_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("LESSON_QUERIES_REPOSITORY_TOKEN");

export type LessonNeighborDirection = "next" | "previous";

export interface ILessonQueriesRepository {
  getStatusChain(lessonId: string): Promise<ContentStatusChain | undefined>;
  getDetail(lessonId: string): Promise<LessonDetail | undefined>;
  getNeighbor(moduleId: string, order: number, direction: LessonNeighborDirection, canManage: boolean): Promise<LessonNeighbor | undefined>;
  getSteps(lessonId: string, includeInactive: boolean): Promise<LessonStepItem[] | undefined>;
  getContent(lessonId: string): Promise<LessonContentView | undefined>;
}
