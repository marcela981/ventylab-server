/*
 * Funcionalidad: Modelos de lectura de lecciones
 * Descripción: Define las interfaces LessonSummary, LessonQuizItem, LessonDetail, LessonNeighbor, LessonStepItem, LessonContentView que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface LessonSummary {
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
  readonly lastModifiedBy?: string;
  readonly lastModifiedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly pageCount: number;
}

export interface LessonQuizItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly questions: unknown;
  readonly passingScore: number;
  readonly timeLimit?: number;
  readonly order: number;
  readonly isActive: boolean;
}

export interface LessonDetail extends LessonSummary {
  readonly sourcePrompt?: string;
  readonly blocks?: unknown;
  readonly module: {
    readonly id: string;
    readonly levelId?: string;
    readonly title: string;
    readonly difficulty?: string;
    readonly order: number;
    readonly isActive: boolean;
  };
  readonly quizzes: LessonQuizItem[];
}

export interface LessonNeighbor extends LessonSummary {
  readonly module: { readonly id: string; readonly title: string };
}

export interface LessonStepItem {
  readonly id: string;
  readonly lessonId: string;
  readonly title?: string;
  readonly content: string;
  readonly contentType: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly lastModifiedBy?: string;
  readonly lastModifiedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LessonContentView {
  readonly id: string;
  readonly title: string;
  readonly slug?: string;
  readonly color?: string;
  readonly tags: string[];
  readonly blocks?: unknown;
  readonly estimatedTime?: number;
  readonly isActive: boolean;
  readonly moduleId: string;
  readonly updatedAt: Date;
}
