/**
 * Level / difficulty color mapping for curriculum UI
 * Used by levels and modules services to add `color` / `levelColor` to API responses.
 * No DB schema change: colors are derived from difficulty (module) or level slug.
 */

export const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
  prerequisitos: '#9E9E9E',
} as const;

const DEFAULT_LEVEL_COLOR = '#4CAF50';

/**
 * Get hex color for a difficulty string (from Module.difficulty or level slug)
 */
export function getColorForDifficulty(difficulty: string | null | undefined): string {
  if (!difficulty) return DEFAULT_LEVEL_COLOR;
  const key = difficulty.toLowerCase();
  return DIFFICULTY_COLORS[key as keyof typeof DIFFICULTY_COLORS] ?? DEFAULT_LEVEL_COLOR;
}
