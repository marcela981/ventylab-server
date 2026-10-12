/*
 * Funcionalidad: Puerto PSEUDONYMIZER_TOKEN
 * Descripción: Define la interfaz IPseudonymizer que reemplaza identificadores por seudónimos estables e irreversibles sin la clave (HMAC-SHA256 con la sal de exportación) e indica si la sal está configurada, de modo que la aplicación nunca ve la sal
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const PSEUDONYMIZER_TOKEN: unique symbol = Symbol("PSEUDONYMIZER_TOKEN");

export interface IPseudonymizer {
  readonly isConfigured: boolean;
  pseudonymize(value: string): string;
}
