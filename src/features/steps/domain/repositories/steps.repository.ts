/*
 * Funcionalidad: Puerto de repositorio STEPS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IStepRepository y su token de inyección para la feature de pasos (tarjetas)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Step } from "@/features/steps/domain/entities/step.entity";

export const STEPS_REPOSITORY_TOKEN: unique symbol = Symbol("STEPS_REPOSITORY_TOKEN");

export interface IStepRepository {
  getById(id: string, transaction?: unknown): Promise<Step | undefined>;
  getOrderedItemsInLesson(lessonId: string, transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  getByOrderInLesson(lessonId: string, order: number, excludeId?: string, transaction?: unknown): Promise<Step | undefined>;
  getMaxOrderInLesson(lessonId: string, transaction?: unknown): Promise<number | undefined>;
  save(step: Step, transaction?: unknown): Promise<void>;
}
