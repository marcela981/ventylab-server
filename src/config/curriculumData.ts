/**
 * Curriculum Data Configuration
 * Defines the explicit module order and structure for each level
 *
 * IMPORTANT: This is the single source of truth for module ordering.
 * Selectors and mappers should consume this data directly instead of recomputing.
 */

/**
 * Difficulty levels including the optional prerequisitos level
 */
export const CURRICULUM_LEVELS = {
  PREREQUISITOS: 'prerequisitos',
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

export type CurriculumLevel = typeof CURRICULUM_LEVELS[keyof typeof CURRICULUM_LEVELS];

/**
 * Module definition with explicit order
 */
export interface CurriculumModule {
  id: string;
  order: number;
  title: string;
  description?: string;
}

/**
 * Level configuration
 */
export interface LevelConfig {
  level: CurriculumLevel;
  isOptional: boolean;
  affectsUnlocking: boolean;
  autoNavigation: boolean;
  modules: CurriculumModule[];
}

/**
 * BEGINNER LEVEL MODULES
 * Explicit order: These are the ONLY 6 modules for beginner level
 * Order is fixed and should not be recomputed
 */
export const BEGINNER_MODULES: CurriculumModule[] = [
  {
    id: 'module-01-inversion-fisiologica',
    order: 1,
    title: 'Inversión Fisiológica',
    description: 'Fundamentos de la inversión fisiológica en ventilación mecánica',
  },
  {
    id: 'module-02-ecuacion-movimiento',
    order: 2,
    title: 'Ecuación de Movimiento',
    description: 'Principios de la ecuación de movimiento respiratorio',
  },
  {
    id: 'module-03-variables-fase',
    order: 3,
    title: 'Variables de Fase',
    description: 'Análisis de las variables de fase en el ciclo ventilatorio',
  },
  {
    id: 'module-04-modos-ventilatorios',
    order: 4,
    title: 'Modos Ventilatorios',
    description: 'Comprensión de los diferentes modos de ventilación mecánica',
  },
  {
    id: 'module-05-monitorizacion-grafica',
    order: 5,
    title: 'Monitorización Gráfica',
    description: 'Interpretación de curvas y gráficos ventilatorios',
  },
  {
    id: 'module-06-efectos-sistemicos',
    order: 6,
    title: 'Efectos Sistémicos',
    description: 'Efectos sistémicos de la ventilación mecánica',
  },
];

/**
 * PREREQUISITOS LEVEL MODULES (Optional)
 * This level does NOT affect:
 * - Beginner level navigation
 * - Beginner level unlocking
 * - Automatic navigation flow
 */
export const PREREQUISITOS_MODULES: CurriculumModule[] = [
  {
    id: 'module-00-anatomia-respiratoria',
    order: 1,
    title: 'Anatomía Respiratoria',
    description: 'Revisión de la anatomía del sistema respiratorio',
  },
  {
    id: 'module-00-fisiologia-basica',
    order: 2,
    title: 'Fisiología Básica',
    description: 'Conceptos básicos de fisiología respiratoria',
  },
];

/**
 * Complete curriculum configuration by level
 */
export const CURRICULUM_CONFIG: Record<CurriculumLevel, LevelConfig> = {
  [CURRICULUM_LEVELS.PREREQUISITOS]: {
    level: CURRICULUM_LEVELS.PREREQUISITOS,
    isOptional: true,
    affectsUnlocking: false,  // Does NOT affect beginner unlocking
    autoNavigation: false,    // No automatic navigation leads into it
    modules: PREREQUISITOS_MODULES,
  },
  [CURRICULUM_LEVELS.BEGINNER]: {
    level: CURRICULUM_LEVELS.BEGINNER,
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: BEGINNER_MODULES,
  },
  [CURRICULUM_LEVELS.INTERMEDIATE]: {
    level: CURRICULUM_LEVELS.INTERMEDIATE,
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: [], // To be populated from database or defined here
  },
  [CURRICULUM_LEVELS.ADVANCED]: {
    level: CURRICULUM_LEVELS.ADVANCED,
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: [], // To be populated from database or defined here
  },
};

/**
 * Get modules for a specific level in the defined order
 * Use this instead of database queries when you need the canonical order
 */
export function getModulesForLevel(level: CurriculumLevel): CurriculumModule[] {
  const config = CURRICULUM_CONFIG[level];
  return config ? [...config.modules] : [];
}

/**
 * Get module IDs for a specific level in order
 */
export function getModuleIdsForLevel(level: CurriculumLevel): string[] {
  return getModulesForLevel(level).map(m => m.id);
}

/**
 * Get the beginner modules (exactly 6, in explicit order)
 * This is the primary function for rendering beginner level cards
 */
export function getBeginnerModules(): CurriculumModule[] {
  return [...BEGINNER_MODULES];
}

/**
 * Get beginner module IDs in order
 */
export function getBeginnerModuleIds(): string[] {
  return BEGINNER_MODULES.map(m => m.id);
}

/**
 * Check if a module belongs to the beginner level
 */
export function isBeginnerModule(moduleId: string): boolean {
  return BEGINNER_MODULES.some(m => m.id === moduleId);
}

/**
 * Check if a module belongs to prerequisitos level
 */
export function isPrerequisitosModule(moduleId: string): boolean {
  return PREREQUISITOS_MODULES.some(m => m.id === moduleId);
}

/**
 * Get the order of a module within beginner level
 * Returns -1 if not found
 */
export function getBeginnerModuleOrder(moduleId: string): number {
  const module = BEGINNER_MODULES.find(m => m.id === moduleId);
  return module ? module.order : -1;
}

/**
 * Get next module in beginner sequence
 * Returns null if at end or not found
 */
export function getNextBeginnerModule(currentModuleId: string): CurriculumModule | null {
  const currentOrder = getBeginnerModuleOrder(currentModuleId);
  if (currentOrder === -1 || currentOrder >= BEGINNER_MODULES.length) {
    return null;
  }
  return BEGINNER_MODULES[currentOrder] || null; // order is 1-indexed, array is 0-indexed
}

/**
 * Get previous module in beginner sequence
 * Returns null if at start or not found
 */
export function getPreviousBeginnerModule(currentModuleId: string): CurriculumModule | null {
  const currentOrder = getBeginnerModuleOrder(currentModuleId);
  if (currentOrder <= 1) {
    return null;
  }
  return BEGINNER_MODULES[currentOrder - 2] || null; // order is 1-indexed, array is 0-indexed
}

/**
 * Check if a level affects unlocking (prerequisitos does not)
 */
export function levelAffectsUnlocking(level: CurriculumLevel): boolean {
  const config = CURRICULUM_CONFIG[level];
  return config ? config.affectsUnlocking : true;
}

/**
 * Check if automatic navigation leads into a level
 */
export function levelHasAutoNavigation(level: CurriculumLevel): boolean {
  const config = CURRICULUM_CONFIG[level];
  return config ? config.autoNavigation : true;
}

/**
 * Get all non-optional levels (excluding prerequisitos)
 */
export function getMainLevels(): CurriculumLevel[] {
  return Object.values(CURRICULUM_LEVELS).filter(
    level => !CURRICULUM_CONFIG[level]?.isOptional
  );
}

/**
 * Map module order index for lesson navigation within beginner level
 * Ensures lessons respect the explicit beginner module order
 */
export function getBeginnerLessonNavigationOrder(
  moduleId: string,
  lessonOrder: number
): { globalOrder: number; isFirstInModule: boolean; isLastInModule: boolean } {
  const moduleOrder = getBeginnerModuleOrder(moduleId);
  if (moduleOrder === -1) {
    return { globalOrder: -1, isFirstInModule: false, isLastInModule: false };
  }

  // Calculate global order based on module position (assuming max 10 lessons per module)
  const globalOrder = (moduleOrder - 1) * 100 + lessonOrder;

  return {
    globalOrder,
    isFirstInModule: lessonOrder === 1,
    isLastInModule: false, // Would need total lessons to determine
  };
}

export default {
  CURRICULUM_LEVELS,
  CURRICULUM_CONFIG,
  BEGINNER_MODULES,
  PREREQUISITOS_MODULES,
  getModulesForLevel,
  getModuleIdsForLevel,
  getBeginnerModules,
  getBeginnerModuleIds,
  isBeginnerModule,
  isPrerequisitosModule,
  getBeginnerModuleOrder,
  getNextBeginnerModule,
  getPreviousBeginnerModule,
  levelAffectsUnlocking,
  levelHasAutoNavigation,
  getMainLevels,
  getBeginnerLessonNavigationOrder,
};
