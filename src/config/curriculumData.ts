/**
 * Curriculum Data Configuration
 * Defines the explicit module order and structure for each level.
 *
 * IMPORTANT: Module IDs here MUST match those in prisma/seed.ts.
 * The database is the single source of truth for content.
 * This file provides fast in-memory lookups for the curriculum service
 * without hitting the database on every request.
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
  levelId: string; // DB level ID (e.g., 'level-beginner')
  isOptional: boolean;
  affectsUnlocking: boolean;
  autoNavigation: boolean;
  modules: CurriculumModule[];
}

// ============================================
// MODULE DEFINITIONS PER LEVEL
// IDs must match prisma/seed.ts exactly
// ============================================

export const PREREQUISITOS_MODULES: CurriculumModule[] = [
  {
    id: 'respiratory-physiology',
    order: 1,
    title: 'Fisiología Respiratoria',
    description: 'Principios del intercambio gaseoso, mecánica ventilatoria y difusión',
  },
  {
    id: 'ventilation-principles',
    order: 2,
    title: 'Principios de Ventilación Mecánica',
    description: 'Indicaciones, objetivos y parámetros básicos de configuración del ventilador',
  },
];

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

export const INTERMEDIATE_MODULES: CurriculumModule[] = [
  {
    id: 'principles-mechanical-ventilation',
    order: 1,
    title: 'Principios de Ventilación Mecánica',
    description: 'Diferencias entre modalidades, indicaciones clínicas y resolución de alarmas',
  },
  {
    id: 'module-02-modalidades-parametros',
    order: 2,
    title: 'Modalidades Ventilatorias y Parámetros',
    description: 'Modalidades ventilatorias y manejo de parámetros críticos',
  },
  {
    id: 'volume-control',
    order: 3,
    title: 'Ventilación Controlada por Volumen (VCV)',
    description: 'Funcionamiento, configuración y práctica de VCV',
  },
  {
    id: 'pressure-control',
    order: 4,
    title: 'Ventilación Controlada por Presión (PCV)',
    description: 'Configuración y manejo de complicaciones en PCV',
  },
  {
    id: 'psv-mode',
    order: 5,
    title: 'Ventilación con Soporte de Presión (PSV)',
    description: 'Funcionamiento y configuración de PSV',
  },
  {
    id: 'simv-mode',
    order: 6,
    title: 'Ventilación Mandatoria Intermitente Sincronizada (SIMV)',
    description: 'SIMV y sus aplicaciones en destete ventilatorio',
  },
];

export const ADVANCED_MODULES: CurriculumModule[] = [
  {
    id: 'ards-management',
    order: 1,
    title: 'Manejo de ARDS y Estrategias de Protección Pulmonar',
    description: 'Protocolo ARDSnet e implementación de estrategias de protección pulmonar',
  },
  {
    id: 'copd-management',
    order: 2,
    title: 'Manejo Ventilatorio en EPOC',
    description: 'Estrategias ventilatorias específicas, auto-PEEP y hiperinsuflación',
  },
  {
    id: 'asthma-crisis',
    order: 3,
    title: 'Manejo de Crisis Asmática',
    description: 'Ventilación permisiva y manejo de complicaciones en crisis asmática',
  },
  {
    id: 'clinical-cases',
    order: 4,
    title: 'Casos Clínicos Complejos',
    description: 'Integración de conocimientos en casos clínicos complejos',
  },
];

// ============================================
// CURRICULUM CONFIG
// ============================================

export const CURRICULUM_CONFIG: Record<CurriculumLevel, LevelConfig> = {
  [CURRICULUM_LEVELS.PREREQUISITOS]: {
    level: CURRICULUM_LEVELS.PREREQUISITOS,
    levelId: 'level-prerequisitos',
    isOptional: true,
    affectsUnlocking: false,
    autoNavigation: false,
    modules: PREREQUISITOS_MODULES,
  },
  [CURRICULUM_LEVELS.BEGINNER]: {
    level: CURRICULUM_LEVELS.BEGINNER,
    levelId: 'level-beginner',
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: BEGINNER_MODULES,
  },
  [CURRICULUM_LEVELS.INTERMEDIATE]: {
    level: CURRICULUM_LEVELS.INTERMEDIATE,
    levelId: 'level-intermedio',
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: INTERMEDIATE_MODULES,
  },
  [CURRICULUM_LEVELS.ADVANCED]: {
    level: CURRICULUM_LEVELS.ADVANCED,
    levelId: 'level-avanzado',
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: ADVANCED_MODULES,
  },
};

// ============================================
// ALL MODULES (flat list for quick lookups)
// ============================================

const ALL_MODULES: CurriculumModule[] = [
  ...PREREQUISITOS_MODULES,
  ...BEGINNER_MODULES,
  ...INTERMEDIATE_MODULES,
  ...ADVANCED_MODULES,
];

// Pre-built maps for O(1) lookups
const MODULE_TO_LEVEL = new Map<string, CurriculumLevel>();
for (const [level, config] of Object.entries(CURRICULUM_CONFIG)) {
  for (const mod of config.modules) {
    MODULE_TO_LEVEL.set(mod.id, level as CurriculumLevel);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getModulesForLevel(level: CurriculumLevel): CurriculumModule[] {
  const config = CURRICULUM_CONFIG[level];
  return config ? [...config.modules] : [];
}

export function getModuleIdsForLevel(level: CurriculumLevel): string[] {
  return getModulesForLevel(level).map(m => m.id);
}

export function getBeginnerModules(): CurriculumModule[] {
  return [...BEGINNER_MODULES];
}

export function getBeginnerModuleIds(): string[] {
  return BEGINNER_MODULES.map(m => m.id);
}

export function isBeginnerModule(moduleId: string): boolean {
  return BEGINNER_MODULES.some(m => m.id === moduleId);
}

export function isPrerequisitosModule(moduleId: string): boolean {
  return PREREQUISITOS_MODULES.some(m => m.id === moduleId);
}

export function isIntermediateModule(moduleId: string): boolean {
  return INTERMEDIATE_MODULES.some(m => m.id === moduleId);
}

export function isAdvancedModule(moduleId: string): boolean {
  return ADVANCED_MODULES.some(m => m.id === moduleId);
}

/**
 * Get the level a module belongs to.
 * Returns undefined if module is not in any level config.
 */
export function getModuleLevel(moduleId: string): CurriculumLevel | undefined {
  return MODULE_TO_LEVEL.get(moduleId);
}

export function getBeginnerModuleOrder(moduleId: string): number {
  const module = BEGINNER_MODULES.find(m => m.id === moduleId);
  return module ? module.order : -1;
}

export function getNextBeginnerModule(currentModuleId: string): CurriculumModule | null {
  const currentOrder = getBeginnerModuleOrder(currentModuleId);
  if (currentOrder === -1 || currentOrder >= BEGINNER_MODULES.length) {
    return null;
  }
  return BEGINNER_MODULES[currentOrder] || null;
}

export function getPreviousBeginnerModule(currentModuleId: string): CurriculumModule | null {
  const currentOrder = getBeginnerModuleOrder(currentModuleId);
  if (currentOrder <= 1) {
    return null;
  }
  return BEGINNER_MODULES[currentOrder - 2] || null;
}

export function levelAffectsUnlocking(level: CurriculumLevel): boolean {
  const config = CURRICULUM_CONFIG[level];
  return config ? config.affectsUnlocking : true;
}

export function levelHasAutoNavigation(level: CurriculumLevel): boolean {
  const config = CURRICULUM_CONFIG[level];
  return config ? config.autoNavigation : true;
}

export function getMainLevels(): CurriculumLevel[] {
  return Object.values(CURRICULUM_LEVELS).filter(
    level => !CURRICULUM_CONFIG[level]?.isOptional
  );
}

/**
 * Get the DB level ID for a curriculum level string.
 */
export function getLevelId(level: CurriculumLevel): string {
  return CURRICULUM_CONFIG[level]?.levelId ?? '';
}

export default {
  CURRICULUM_LEVELS,
  CURRICULUM_CONFIG,
  BEGINNER_MODULES,
  PREREQUISITOS_MODULES,
  INTERMEDIATE_MODULES,
  ADVANCED_MODULES,
  getModulesForLevel,
  getModuleIdsForLevel,
  getBeginnerModules,
  getBeginnerModuleIds,
  isBeginnerModule,
  isPrerequisitosModule,
  isIntermediateModule,
  isAdvancedModule,
  getModuleLevel,
  getBeginnerModuleOrder,
  getNextBeginnerModule,
  getPreviousBeginnerModule,
  levelAffectsUnlocking,
  levelHasAutoNavigation,
  getMainLevels,
  getLevelId,
};
