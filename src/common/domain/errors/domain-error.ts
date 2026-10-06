/*
 * Funcionalidad: Clase base DomainError
 * Descripción: Base de todos los errores de dominio con mensaje técnico y código i18n que traduce el filtro global
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DomainError extends Error {
  public constructor(
    public message: string,
    public code: string,
  ) {
    super(message);
    this.code = code;
  }
}
