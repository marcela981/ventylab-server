/*
 * Funcionalidad: Puerto del generador de semillas de simulación
 * Descripción: Contrato que entrega la semilla entera no negativa de 31 bits con la que el servidor fija el generador pseudoaleatorio del motor en cada sesión o prueba de caso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const SIMULATION_SEED_GENERATOR_TOKEN: unique symbol = Symbol("SIMULATION_SEED_GENERATOR_TOKEN");

export interface ISimulationSeedGenerator {
  next(): number;
}
