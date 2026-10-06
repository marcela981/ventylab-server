/*
 * Funcionalidad: Generación de slugs de página
 * Descripción: Convierte un título en un slug en minúsculas, sin tildes y separado por guiones para identificar páginas dentro de su módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const MAX_SLUG_LENGTH: number = 120;

export function slugify(value: string): string {
  const slug: string = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug.length > 0 ? slug : "page";
}
