/*
 * Funcionalidad: Vistas de progreso
 * Descripción: Define las interfaces calculadas que devuelven los casos de uso de progreso (lección, módulo, detalle por pasos, resumen general, logros, hitos y habilidades)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LessonProgressView {
  readonly lessonId: string;
  readonly completed: boolean;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
  readonly completionPercentage: number;
  readonly currentStep: number;
  readonly totalSteps: number;
}

export type ModuleProgressSource = "user_progress" | "realtime_calculation" | "composite_aggregate" | "not_found";

export interface ModuleProgressSummary {
  readonly moduleId: string;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly completionPercentage: number;
  readonly isModuleCompleted: boolean;
  readonly timeSpent: number;
  readonly completedAt?: Date;
  readonly lessons: LessonProgressView[];
  readonly source: ModuleProgressSource;
}

export interface LessonProgressDetails {
  readonly lessonId: string;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly completed: boolean;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
  readonly progressPercentage: number;
}

export interface OverviewStats {
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly modulesCompleted: number;
  readonly totalModules: number;
  readonly xpTotal: number;
  readonly level: number;
  readonly nextLevelXp: number;
  readonly streakDays: number;
}

export interface OverviewModuleItem {
  readonly moduleId: string;
  readonly title: string;
  readonly levelId?: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly lessonsTotal: number;
  readonly lessonsCompleted: number;
  readonly percent: number;
  readonly isAvailable: boolean;
  readonly completed: boolean;
}

export interface OverviewLessonItem {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly completed: boolean;
  readonly progress: number;
  readonly xpEarned: number;
  readonly lastVisitedAt?: Date;
  readonly updatedAt?: Date;
}

export interface OverviewLevelItem {
  readonly levelId: string;
  readonly slug: string;
  readonly title: string;
  readonly order: number;
  readonly moduleIds: string[];
  readonly totalModules: number;
  readonly completedModules: number;
  readonly progressPercentage: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
}

export interface ProgressOverview {
  readonly stats: OverviewStats;
  readonly modules: OverviewModuleItem[];
  readonly lessons: OverviewLessonItem[];
  readonly levels: OverviewLevelItem[];
}

export interface UnlockedAchievementView {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly unlockedAt: Date;
  readonly xpReward: number;
}

export interface MilestoneItem {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export interface MilestonesSummary {
  readonly milestones: MilestoneItem[];
  readonly totalCompleted: number;
  readonly totalAvailable: number;
  readonly nextMilestone?: MilestoneItem;
}

export interface SkillItem {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
}

export interface SkillsSummary {
  readonly skills: SkillItem[];
  readonly categories: SkillItem[];
  readonly overallLevel: string;
}

export interface UnlockedModules {
  readonly unlockedModuleIds: string[];
  readonly count: number;
}
