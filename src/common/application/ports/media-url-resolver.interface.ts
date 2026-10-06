/*
 * Funcionalidad: Puerto IMediaUrlResolver
 * Descripción: Define el contrato y el token de inyección para resolver en lote las URLs de acceso de archivos de media a partir de sus ids, sin acoplar el contenido curricular a la feature de media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const MEDIA_URL_RESOLVER_TOKEN: unique symbol = Symbol("MEDIA_URL_RESOLVER_TOKEN");

export interface ResolvedMediaURL {
  mediaId: string;
  url: string;
  mimeType: string;
  kind: "IMAGE" | "VIDEO" | "FILE";
  expiresAt?: Date;
}

export interface IMediaUrlResolver {
  resolveMany(mediaIds: string[]): Promise<Map<string, ResolvedMediaURL>>;
}
