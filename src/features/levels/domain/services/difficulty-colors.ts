/*
 * Funcionalidad: Servicio de dominio difficulty-colors
 * Descripción: Reúne las funciones y constantes DIFFICULTY_COLORS, DEFAULT_LEVEL_COLOR, getColorForDifficulty de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const DIFFICULTY_COLORS: Readonly<Record<string, string>> = {
  beginner: "#4CAF50",
  intermediate: "#FF9800",
  advanced: "#F44336",
  prerequisitos: "#9E9E9E",
  "ventylab-principiante": "#7B1FA2",
  "ventylab-intermedio": "#6A1B9A",
  "ventylab-avanzado": "#4A148C",
};

export const DEFAULT_LEVEL_COLOR: string = "#4CAF50";

export function getColorForDifficulty(difficulty?: string): string {
  if (!difficulty) {
    return DEFAULT_LEVEL_COLOR;
  }

  return DIFFICULTY_COLORS[difficulty.toLowerCase()] ?? DEFAULT_LEVEL_COLOR;
}
