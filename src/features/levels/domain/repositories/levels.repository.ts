/*
 * Funcionalidad: Puerto de repositorio LEVELS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz ILevelRepository y su token de inyección para la feature de niveles
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Level } from "@/features/levels/domain/entities/level.entity";

export const LEVELS_REPOSITORY_TOKEN: unique symbol = Symbol("LEVELS_REPOSITORY_TOKEN");

export interface ILevelRepository {
  getById(id: string, transaction?: unknown): Promise<Level | undefined>;
  getByIds(ids: string[], transaction?: unknown): Promise<Level[]>;
  existsWithTitle(title: string, excludeId?: string, transaction?: unknown): Promise<boolean>;
  getByOrder(order: number, excludeId?: string, transaction?: unknown): Promise<Level | undefined>;
  getMaxOrder(transaction?: unknown): Promise<number | undefined>;
  getMaxOrderUnderParent(parentId?: string, transaction?: unknown): Promise<number | undefined>;
  getPrerequisiteEdges(transaction?: unknown): Promise<PrerequisiteEdge[]>;
  getOrderedItems(transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  save(level: Level, transaction?: unknown): Promise<void>;
}
