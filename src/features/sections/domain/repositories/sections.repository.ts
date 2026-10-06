/*
 * Funcionalidad: Puerto de repositorio SECTIONS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ISectionRepository y su token de inyección para leer, ordenar y persistir el agregado Section
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Section } from "@/features/sections/domain/entities/section.entity";

export const SECTIONS_REPOSITORY_TOKEN: unique symbol = Symbol("SECTIONS_REPOSITORY_TOKEN");

export interface ISectionRepository {
  getById(id: string, transaction?: unknown): Promise<Section | undefined>;
  existsWithSlug(slug: string, excludeId?: string, transaction?: unknown): Promise<boolean>;
  getMaxOrder(transaction?: unknown): Promise<number | undefined>;
  getOrderedItems(transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  save(section: Section, transaction?: unknown): Promise<void>;
}
