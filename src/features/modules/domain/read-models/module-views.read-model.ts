/*
 * Funcionalidad: Modelos de lectura de módulos
 * Descripción: Define las interfaces ModuleSummary, ModulePrerequisiteSummary, ModuleListItem, ModuleDetail, ModuleLessonItem, ModuleLessonsView que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface ModuleSummary {
  readonly id: string;
  readonly levelId?: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly thumbnail?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly status: ContentStatusValue;
  readonly color?: string;
  readonly tags: string[];
  readonly lastModifiedBy?: string;
  readonly lastModifiedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lessonCount: number;
  readonly levelColor: string;
}

export interface ModulePrerequisiteSummary {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly category?: string;
  readonly estimatedTime?: number;
}

export interface ModuleListItem extends ModuleSummary {
  readonly prerequisites: ModulePrerequisiteSummary[];
}

export interface ModuleDetail extends ModuleSummary {
  readonly prerequisites: ModulePrerequisiteSummary[];
  readonly dependentModules: { readonly id: string; readonly title: string }[];
}

export interface ModuleLessonItem {
  readonly id: string;
  readonly moduleId: string;
  readonly title: string;
  readonly slug?: string;
  readonly content?: string;
  readonly order: number;
  readonly estimatedTime?: number;
  readonly aiGenerated: boolean;
  readonly isActive: boolean;
  readonly status: ContentStatusValue;
  readonly color?: string;
  readonly tags: string[];
  readonly hasRequiredQuiz: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly quizCount: number;
  readonly pageCount: number;
}

export interface ModuleFullBlock {
  readonly id: string;
  readonly order: number;
  readonly type: string;
  readonly title?: string;
  readonly content: unknown;
  readonly estimatedTime?: number;
  readonly mediaId?: string;
  readonly mediaUrl?: string | null;
}

export interface ModuleFullPage {
  readonly id: string;
  readonly lessonId?: string;
  readonly title: string;
  readonly slug: string;
  readonly order: number;
  readonly type: string;
  readonly status: ContentStatusValue;
  readonly estimatedMinutes?: number;
  readonly blocks: ModuleFullBlock[];
}

export interface ModuleFullLesson {
  readonly id: string;
  readonly title: string;
  readonly slug?: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly estimatedTime?: number;
  readonly pages: ModuleFullPage[];
}

export interface ModuleFullContent {
  readonly id: string;
  readonly levelId?: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly thumbnail?: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly statusChain: ReadonlyArray<ContentStatusValue | undefined>;
  readonly lessons: ModuleFullLesson[];
  readonly unassignedPages: ModuleFullPage[];
}
