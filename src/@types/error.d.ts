/*
 * Funcionalidad: Tipos globales de Error
 * Descripción: Amplía la interfaz global Error con la marca __sentry_captured__ que usa el filtro de excepciones para no reportar dos veces a Sentry
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export {};

declare global {
  interface Error {
    __sentry_captured__?: boolean;
  }
}
