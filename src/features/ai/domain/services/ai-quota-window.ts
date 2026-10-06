/*
 * Funcionalidad: Ventana diaria de cuota de IA
 * Descripción: Calcula el inicio del día UTC desde el que se cuenta el consumo de IA de un usuario y la medianoche UTC siguiente en la que su cuota se reinicia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const MS_PER_DAY: number = 24 * 60 * 60 * 1000;

export function startOfUtcDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

export function nextUtcMidnight(at: Date): Date {
  return new Date(startOfUtcDay(at).getTime() + MS_PER_DAY);
}
