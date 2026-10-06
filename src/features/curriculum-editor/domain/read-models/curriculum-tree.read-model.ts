/*
 * Funcionalidad: Modelos de lectura de editor del currículo
 * Descripción: Define las interfaces CurriculumTreeLesson, CurriculumTreeModule, CurriculumTreeLevel que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface CurriculumTreeLesson {
  readonly id: string;
  readonly title: string;
  readonly slug?: string;
  readonly order: number;
  readonly color?: string;
  readonly tags: string[];
  readonly isActive: boolean;
  readonly status: ContentStatusValue;
  readonly estimatedTime?: number;
  readonly blocks?: unknown;
}

export interface CurriculumTreeModule {
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lessons: CurriculumTreeLesson[];
}

export interface CurriculumTreeLevel {
  readonly id: string;
  readonly title: string;
  readonly track: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly status: ContentStatusValue;
  readonly color?: string;
  readonly tags: string[];
  readonly parentId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly modules: CurriculumTreeModule[];
  readonly children: CurriculumTreeLevel[];
}
