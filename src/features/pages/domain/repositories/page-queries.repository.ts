/*
 * Funcionalidad: Puerto de repositorio PAGE_QUERIES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IPageQueriesRepository y su token de inyección para la feature de páginas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusChain } from "@/features/curriculum/domain/services/content-visibility";
import { type PageSummary, type PageView } from "@/features/pages/domain/read-models/page-views.read-model";

export const PAGE_QUERIES_REPOSITORY_TOKEN: unique symbol = Symbol("PAGE_QUERIES_REPOSITORY_TOKEN");

export interface IPageQueriesRepository {
  getStatusChain(pageId: string): Promise<ContentStatusChain | undefined>;
  getById(pageId: string): Promise<PageView | undefined>;
  getVisibleByLegacyJsonId(legacyJsonId: string, canManage: boolean): Promise<PageView | undefined>;
  getVisibleByLegacyLessonId(lessonId: string, canManage: boolean): Promise<PageView | undefined>;
  getVisibleByModule(moduleId: string, canManage: boolean): Promise<PageSummary[]>;
  getVisibleByLesson(lessonId: string, canManage: boolean): Promise<PageSummary[]>;
}
