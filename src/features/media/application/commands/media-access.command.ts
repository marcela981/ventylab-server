/*
 * Funcionalidad: Comando MediaAccessCommand
 * Descripción: Identifica un archivo de media y el usuario que lo solicita (id, rol y permisos) para las operaciones de consulta, URL firmada y borrado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MediaRequester } from "@/features/media/domain/services/media-access";

export class MediaAccessCommand {
  public readonly mediaId: string;
  public readonly requester: MediaRequester;

  public constructor({ mediaId, requester }: { mediaId: string; requester: MediaRequester }) {
    this.mediaId = mediaId;
    this.requester = requester;
  }
}
