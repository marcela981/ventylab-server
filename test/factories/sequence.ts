/*
 * Funcionalidad: Secuencia de las fábricas de prueba
 * Descripción: Contador determinista por archivo de prueba que las fábricas usan como sufijo único de correos, títulos, slugs y órdenes, de modo que dos llamadas nunca choquen con restricciones únicas aunque la base de datos no se restablezca entre ellas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
let counter: number = 0;

export function nextSequence(): number {
  counter++;

  return counter;
}

export function uniqueLabel(prefix: string): string {
  return `${prefix}-${nextSequence()}`;
}
