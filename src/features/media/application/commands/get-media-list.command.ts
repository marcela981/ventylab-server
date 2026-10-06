/*
 * Funcionalidad: Comando GetMediaListCommand
 * Descripción: Transporta los filtros de paginación de media y el usuario que consulta, para restringir a los docentes a sus propios archivos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GetMediaListQuery } from "@/features/media/domain/repositories/media.repository";
import { type MediaRequester } from "@/features/media/domain/services/media-access";

export class GetMediaListCommand {
  public readonly query: GetMediaListQuery;
  public readonly requester: MediaRequester;

  public constructor({ query, requester }: { query: GetMediaListQuery; requester: MediaRequester }) {
    this.query = query;
    this.requester = requester;
  }
}
