/*
 * Funcionalidad: Puerto ITransactionManager
 * Descripción: Define el contrato y el token de inyección para ejecutar operaciones dentro de una transacción de base de datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const TRANSACTION_MANAGER_TOKEN: unique symbol = Symbol("TRANSACTION_MANAGER_TOKEN");

export interface ITransactionManager {
  run<T>(work: (transaction: unknown) => Promise<T>): Promise<T>;
}
