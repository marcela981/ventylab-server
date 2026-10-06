/*
 * Funcionalidad: Servicio de dominio curriculum-catalog
 * Descripción: Reúne las funciones y constantes CurriculumModule, CurriculumLevelConfig, PREREQUISITOS_MODULES, BEGINNER_MODULES, INTERMEDIATE_MODULES, ADVANCED_MODULES y otros de la feature de currículo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ADVANCED_CURRICULUM_LEVEL,
  BEGINNER_CURRICULUM_LEVEL,
  type CurriculumLevelValue,
  INTERMEDIATE_CURRICULUM_LEVEL,
  PREREQUISITOS_CURRICULUM_LEVEL,
} from "@/features/curriculum/domain/value-objects/curriculum-level";

export interface CurriculumModule {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly description?: string;
}

export interface CurriculumLevelConfig {
  readonly level: CurriculumLevelValue;
  readonly levelId: string;
  readonly isOptional: boolean;
  readonly affectsUnlocking: boolean;
  readonly autoNavigation: boolean;
  readonly modules: readonly CurriculumModule[];
}

export const PREREQUISITOS_MODULES: readonly CurriculumModule[] = [
  {
    id: "respiratory-physiology",
    order: 1,
    title: "Fisiología Respiratoria",
    description: "Principios del intercambio gaseoso, mecánica ventilatoria y difusión",
  },
  {
    id: "ventilation-principles",
    order: 2,
    title: "Principios de Ventilación Mecánica",
    description: "Indicaciones, objetivos y parámetros básicos de configuración del ventilador",
  },
];

export const BEGINNER_MODULES: readonly CurriculumModule[] = [
  {
    id: "module-01-inversion-fisiologica",
    order: 1,
    title: "Inversión Fisiológica",
    description: "Fundamentos de la inversión fisiológica en ventilación mecánica",
  },
  {
    id: "module-02-ecuacion-movimiento",
    order: 2,
    title: "Ecuación de Movimiento",
    description: "Principios de la ecuación de movimiento respiratorio",
  },
  {
    id: "module-03-variables-fase",
    order: 3,
    title: "Variables de Fase",
    description: "Análisis de las variables de fase en el ciclo ventilatorio",
  },
  {
    id: "module-04-modos-ventilatorios",
    order: 4,
    title: "Modos Ventilatorios",
    description: "Comprensión de los diferentes modos de ventilación mecánica",
  },
  {
    id: "module-05-monitorizacion-grafica",
    order: 5,
    title: "Monitorización Gráfica",
    description: "Interpretación de curvas y gráficos ventilatorios",
  },
  {
    id: "module-06-efectos-sistemicos",
    order: 6,
    title: "Efectos Sistémicos",
    description: "Efectos sistémicos de la ventilación mecánica",
  },
];

export const INTERMEDIATE_MODULES: readonly CurriculumModule[] = [
  {
    id: "principles-mechanical-ventilation",
    order: 1,
    title: "Principios de Ventilación Mecánica",
    description: "Diferencias entre modalidades, indicaciones clínicas y resolución de alarmas",
  },
  {
    id: "module-02-modalidades-parametros",
    order: 2,
    title: "Modalidades Ventilatorias y Parámetros",
    description: "Modalidades ventilatorias y manejo de parámetros críticos",
  },
  {
    id: "volume-control",
    order: 3,
    title: "Ventilación Controlada por Volumen (VCV)",
    description: "Funcionamiento, configuración y práctica de VCV",
  },
  {
    id: "pressure-control",
    order: 4,
    title: "Ventilación Controlada por Presión (PCV)",
    description: "Configuración y manejo de complicaciones en PCV",
  },
  {
    id: "psv-mode",
    order: 5,
    title: "Ventilación con Soporte de Presión (PSV)",
    description: "Funcionamiento y configuración de PSV",
  },
  {
    id: "simv-mode",
    order: 6,
    title: "Ventilación Mandatoria Intermitente Sincronizada (SIMV)",
    description: "SIMV y sus aplicaciones en destete ventilatorio",
  },
];

export const ADVANCED_MODULES: readonly CurriculumModule[] = [
  {
    id: "ards-management",
    order: 1,
    title: "Manejo de ARDS y Estrategias de Protección Pulmonar",
    description: "Protocolo ARDSnet e implementación de estrategias de protección pulmonar",
  },
  {
    id: "copd-management",
    order: 2,
    title: "Manejo Ventilatorio en EPOC",
    description: "Estrategias ventilatorias específicas, auto-PEEP y hiperinsuflación",
  },
  {
    id: "asthma-crisis",
    order: 3,
    title: "Manejo de Crisis Asmática",
    description: "Ventilación permisiva y manejo de complicaciones en crisis asmática",
  },
];

export const CURRICULUM_CONFIG: Readonly<Record<CurriculumLevelValue, CurriculumLevelConfig>> = {
  prerequisitos: {
    level: PREREQUISITOS_CURRICULUM_LEVEL,
    levelId: "level-prerequisitos",
    isOptional: true,
    affectsUnlocking: false,
    autoNavigation: false,
    modules: PREREQUISITOS_MODULES,
  },
  beginner: {
    level: BEGINNER_CURRICULUM_LEVEL,
    levelId: "level-beginner",
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: BEGINNER_MODULES,
  },
  intermediate: {
    level: INTERMEDIATE_CURRICULUM_LEVEL,
    levelId: "level-intermedio",
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: INTERMEDIATE_MODULES,
  },
  advanced: {
    level: ADVANCED_CURRICULUM_LEVEL,
    levelId: "level-avanzado",
    isOptional: false,
    affectsUnlocking: true,
    autoNavigation: true,
    modules: ADVANCED_MODULES,
  },
};

export function isPrerequisitosModule(moduleId: string): boolean {
  return PREREQUISITOS_MODULES.some((module: CurriculumModule) => module.id === moduleId);
}

export function isBeginnerModule(moduleId: string): boolean {
  return BEGINNER_MODULES.some((module: CurriculumModule) => module.id === moduleId);
}

export function getBeginnerModuleOrder(moduleId: string): number {
  return BEGINNER_MODULES.find((module: CurriculumModule) => module.id === moduleId)?.order ?? -1;
}

export function getNextBeginnerModule(moduleId: string): CurriculumModule | undefined {
  const order: number = getBeginnerModuleOrder(moduleId);

  if (order === -1 || order >= BEGINNER_MODULES.length) {
    return undefined;
  }

  return BEGINNER_MODULES[order];
}

export function getPreviousBeginnerModule(moduleId: string): CurriculumModule | undefined {
  const order: number = getBeginnerModuleOrder(moduleId);

  if (order <= 1) {
    return undefined;
  }

  return BEGINNER_MODULES[order - 2];
}
