/*
 * Funcionalidad: Puerto de repositorio PAGES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IPageRepository para leer, ordenar, versionar (instantáneas en PageRevision) y persistir el agregado Page
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Page } from "@/features/pages/domain/entities/page.entity";

export const PAGES_REPOSITORY_TOKEN: unique symbol = Symbol("PAGES_REPOSITORY_TOKEN");

export interface IPageRepository {
  getById(id: string, transaction?: unknown): Promise<Page | undefined>;
  existsWithSlugInModule(moduleId: string, slug: string, excludeId?: string, transaction?: unknown): Promise<boolean>;
  getMaxOrderInModule(moduleId: string, transaction?: unknown): Promise<number | undefined>;
  getOrderedItemsInLesson(lessonId: string, transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  saveRevision(page: Page, changedBy: string, changeLog?: string, transaction?: unknown): Promise<void>;
  save(page: Page, transaction?: unknown): Promise<void>;
}
