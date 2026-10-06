/*
 * Funcionalidad: Tipo ListQuery
 * Descripción: Define los parámetros comunes de consultas paginadas: página, límite, ids, rango de fechas y orden
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface ListQuery {
  page: number;
  limit: number;
  ids?: string[];
  createdAtFrom?: Date;
  createdAtTo?: Date;
  sortOrder?: "asc" | "desc";
}
