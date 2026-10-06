/*
 * Funcionalidad: Modelos de lectura de páginas
 * Descripción: Define las interfaces PageSectionView, PageView, PageSummary que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface PageSectionView {
  readonly id: string;
  readonly pageId: string;
  readonly order: number;
  readonly type: string;
  readonly title?: string;
  readonly content: unknown;
  readonly sectionId?: string;
  readonly estimatedTime?: number;
  readonly isActive: boolean;
  readonly mediaId?: string;
  readonly mediaUrl?: string | null;
  readonly createdBy?: string;
  readonly updatedBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PageView {
  readonly id: string;
  readonly moduleId: string;
  readonly lessonId?: string;
  readonly title: string;
  readonly slug: string;
  readonly order: number;
  readonly type: string;
  readonly description?: string;
  readonly difficulty: string;
  readonly bloomLevel?: string;
  readonly estimatedMinutes?: number;
  readonly learningObjectives: string[];
  readonly prerequisites: string[];
  readonly keyTakeaways: string[];
  readonly tags: string[];
  readonly hasRequiredQuiz: boolean;
  readonly minQuizScore?: number;
  readonly aiConfig?: unknown;
  readonly resources?: unknown;
  readonly version: number;
  readonly isActive: boolean;
  readonly isPublished: boolean;
  readonly status: ContentStatusValue;
  readonly legacyLessonId?: string;
  readonly legacyJsonId?: string;
  readonly createdBy: string;
  readonly updatedBy?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly publishedAt?: Date;
  readonly sections: PageSectionView[];
  readonly module: { readonly id: string; readonly title: string; readonly levelId?: string; readonly isActive: boolean };
}

export interface PageSummary {
  readonly id: string;
  readonly lessonId?: string;
  readonly status: ContentStatusValue;
  readonly title: string;
  readonly slug: string;
  readonly order: number;
  readonly type: string;
  readonly difficulty: string;
  readonly estimatedMinutes?: number;
  readonly learningObjectives: string[];
  readonly hasRequiredQuiz: boolean;
  readonly legacyLessonId?: string;
  readonly legacyJsonId?: string;
}
