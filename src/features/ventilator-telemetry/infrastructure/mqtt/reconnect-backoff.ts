/*
 * Funcionalidad: Retroceso exponencial de reconexión MQTT
 * Descripción: Calcula el retardo del intento N como base·2^N con fluctuación aleatoria (mitad fija y mitad aleatoria) limitado al máximo configurado; los intentos no tienen límite
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const MAX_EXPONENT: number = 30;

export function computeReconnectDelay(attempt: number, baseMs: number, maxMs: number, random: number): number {
  const exponential: number = Math.min(maxMs, baseMs * 2 ** Math.min(Math.max(attempt, 0), MAX_EXPONENT));
  const half: number = exponential / 2;

  return Math.round(half + half * Math.min(Math.max(random, 0), 1));
}
