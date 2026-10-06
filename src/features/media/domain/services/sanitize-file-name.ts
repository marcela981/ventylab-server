/*
 * Funcionalidad: Saneamiento de nombres de archivo
 * Descripción: Convierte el nombre original de un archivo en un segmento seguro para la clave de almacenamiento (ASCII, sin separadores de ruta ni espacios, longitud acotada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const MAX_FILE_NAME_LENGTH: number = 100;
const FALLBACK_FILE_NAME: string = "file";

export function sanitizeFileName(originalName: string): string {
  const sanitized: string = originalName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-MAX_FILE_NAME_LENGTH)
    .replace(/^[-.]+/, "");

  return sanitized || FALLBACK_FILE_NAME;
}
