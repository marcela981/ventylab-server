/*
 * Funcionalidad: Puerto de repositorio LESSONS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILessonRepository y su token de inyección para la feature de lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Lesson } from "@/features/lessons/domain/entities/lesson.entity";

export const LESSONS_REPOSITORY_TOKEN: unique symbol = Symbol("LESSONS_REPOSITORY_TOKEN");

export interface ILessonRepository {
  getById(id: string, transaction?: unknown): Promise<Lesson | undefined>;
  getByOrderInModule(moduleId: string, order: number, excludeId?: string, transaction?: unknown): Promise<Lesson | undefined>;
  getOrderedItemsInModule(moduleId: string, transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  save(lesson: Lesson, transaction?: unknown): Promise<void>;
}
