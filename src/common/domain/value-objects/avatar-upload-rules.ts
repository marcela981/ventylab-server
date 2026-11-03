/*
 * Funcionalidad: Reglas de la foto de perfil
 * Descripción: Límites compartidos de la foto de perfil subida (reglas de julio): tipos png, jpeg o webp y tamaño máximo de 2 MB; los usan el límite de Multer de PUT /api/users/me/avatar y la política de subida de la feature de media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AVATAR_MAX_BYTES: number = 2 * 1024 * 1024;

export const AVATAR_MIME_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"] as const;
