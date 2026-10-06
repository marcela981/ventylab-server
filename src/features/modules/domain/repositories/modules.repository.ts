/*
 * Funcionalidad: Puerto de repositorio MODULES_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IModuleRepository y su token de inyección para la feature de módulos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type Module } from "@/features/modules/domain/entities/module.entity";

export const MODULES_REPOSITORY_TOKEN: unique symbol = Symbol("MODULES_REPOSITORY_TOKEN");

export interface IModuleRepository {
  getById(id: string, transaction?: unknown): Promise<Module | undefined>;
  countExisting(ids: string[], transaction?: unknown): Promise<number>;
  existsWithTitle(title: string, transaction?: unknown): Promise<boolean>;
  getByOrder(order: number, excludeId?: string, transaction?: unknown): Promise<Module | undefined>;
  getMaxOrderInLevel(levelId: string, transaction?: unknown): Promise<number | undefined>;
  getPrerequisiteEdges(transaction?: unknown): Promise<PrerequisiteEdge[]>;
  getOrderedItemsInLevel(levelId: string, transaction?: unknown): Promise<OrderedItem[]>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  save(module: Module, transaction?: unknown): Promise<void>;
}
