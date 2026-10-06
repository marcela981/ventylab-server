/*
 * Funcionalidad: Servicio de dominio level-curriculum-labels
 * Descripción: Reúne las funciones y constantes ADVANCED_LEVEL_ID, PATHOLOGIES_CATEGORY, FIRST_PATHOLOGY_MODULE_ORDER, getLevelSlug, getLevelEmoji de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const LEVEL_SLUG_MAP: Readonly<Record<string, string>> = {
  "level-prerequisitos": "prerequisitos",
  "level-beginner": "beginner",
  "level-intermedio": "intermediate",
  "level-avanzado": "advanced",
  "ventylab-principiante": "ventylab-principiante",
  "ventylab-intermedio": "ventylab-intermedio",
  "ventylab-avanzado": "ventylab-avanzado",
};

const LEVEL_EMOJIS: Readonly<Record<string, string>> = {
  prerequisitos: "🔬",
  beginner: "🌱",
  intermediate: "⚡",
  advanced: "🎯",
  "ventylab-principiante": "💡",
  "ventylab-intermedio": "🖥️",
  "ventylab-avanzado": "🚀",
};

const DEFAULT_LEVEL_EMOJI: string = "📚";

export const ADVANCED_LEVEL_ID: string = "level-avanzado";

export const PATHOLOGIES_CATEGORY: string = "pathologies";

export const FIRST_PATHOLOGY_MODULE_ORDER: number = 5;

export function getLevelSlug(levelId: string): string {
  return LEVEL_SLUG_MAP[levelId] ?? levelId.replace(/^level-/, "");
}

export function getLevelEmoji(slug: string): string {
  return LEVEL_EMOJIS[slug] ?? DEFAULT_LEVEL_EMOJI;
}
