/*
 * Funcionalidad: Valores de MediaKind
 * Descripción: Define los tipos de archivo de media admitidos (imagen, video y archivo) alineados con el enum MediaKind de Prisma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type MediaKindValue = "IMAGE" | "VIDEO" | "FILE";

export const IMAGE_MEDIA_KIND_VALUE: MediaKindValue = "IMAGE";
export const VIDEO_MEDIA_KIND_VALUE: MediaKindValue = "VIDEO";
export const FILE_MEDIA_KIND_VALUE: MediaKindValue = "FILE";

export const MEDIA_KIND_VALUES: readonly MediaKindValue[] = [IMAGE_MEDIA_KIND_VALUE, VIDEO_MEDIA_KIND_VALUE, FILE_MEDIA_KIND_VALUE] as const;
