/*
 * Funcionalidad: Puerto IDatabaseHealthProbe
 * Descripción: Contrato para comprobar con una consulta mínima que la base de datos responde; lo usan la preparación del servicio (/health/ready) y el estado del sistema
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const DATABASE_HEALTH_PROBE_TOKEN: unique symbol = Symbol("DATABASE_HEALTH_PROBE_TOKEN");

export interface IDatabaseHealthProbe {
  ping(): Promise<void>;
}
