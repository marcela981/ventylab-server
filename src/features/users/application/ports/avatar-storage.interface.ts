/*
 * Funcionalidad: Puerto IAvatarStorage
 * Descripción: Contrato con el que la feature de usuarios guarda y borra la foto de perfil subida (la valida y la registra la feature de media); lo enlaza la raíz de composición a MediaFacade, de modo que usuarios no importa media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AVATAR_STORAGE_TOKEN: unique symbol = Symbol("AVATAR_STORAGE_TOKEN");

export interface AvatarFile {
  readonly ownerId: string;
  readonly content: Buffer;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly originalName: string;
}

export interface IAvatarStorage {
  // Validates (png, jpeg or webp up to 2 MB with matching first bytes), stores and records the file; returns its media ID.
  store(file: AvatarFile): Promise<string>;
  remove(mediaId: string, ownerId: string): Promise<void>;
}
