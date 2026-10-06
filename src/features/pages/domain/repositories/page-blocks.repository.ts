/*
 * Funcionalidad: Puerto de repositorio PAGE_BLOCKS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IPageBlockRepository para leer, ordenar, persistir y eliminar bloques de página, y comprobar que existan los archivos de media referenciados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";
import { type PageBlock } from "@/features/pages/domain/entities/page-block.entity";

export const PAGE_BLOCKS_REPOSITORY_TOKEN: unique symbol = Symbol("PAGE_BLOCKS_REPOSITORY_TOKEN");

export interface IPageBlockRepository {
  getById(blockId: string, transaction?: unknown): Promise<PageBlock | undefined>;
  getOrderedItemsInPage(pageId: string, transaction?: unknown): Promise<OrderedItem[]>;
  getMaxOrderInPage(pageId: string, transaction?: unknown): Promise<number | undefined>;
  mediaExists(mediaId: string, transaction?: unknown): Promise<boolean>;
  applyOrder(entries: ReadonlyArray<ReorderEntry>, transaction?: unknown): Promise<void>;
  save(block: PageBlock, transaction?: unknown): Promise<void>;
  delete(blockId: string, transaction?: unknown): Promise<void>;
}
