/*
 * Funcionalidad: Repositorio de media (interfaz)
 * Descripción: Define el contrato de persistencia de Media, incluidas las lecturas acotadas sobre page_sections para la regla de borrado en uso y la visibilidad para estudiantes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type Media } from "@/features/media/domain/entities/media.entity";
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";

export const MEDIA_REPOSITORY_TOKEN: unique symbol = Symbol("MEDIA_REPOSITORY_TOKEN");

export interface GetMediaListQuery extends ListQuery {
  ownerId?: string;
  kind?: MediaKindValue;
  search?: string;
}

export interface IMediaRepository {
  getAll(query: GetMediaListQuery, transaction?: unknown): Promise<Paginated<Media>>;
  getById(id: string, transaction?: unknown): Promise<Media | undefined>;
  getByIds(ids: string[], transaction?: unknown): Promise<Media[]>;
  countPageSectionReferences(mediaId: string, transaction?: unknown): Promise<number>;
  isReferencedByPublishedContent(mediaId: string, transaction?: unknown): Promise<boolean>;
  save(media: Media, transaction?: unknown): Promise<void>;
  delete(media: Media, transaction?: unknown): Promise<void>;
}
