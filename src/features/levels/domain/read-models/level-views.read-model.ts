/*
 * Funcionalidad: Modelos de lectura de niveles
 * Descripción: Define las interfaces LevelSummary, LevelDetailModule, LevelDetail, LevelModuleItem, LevelPrerequisiteItem, LevelPrerequisitesView y otros que devuelven las consultas de la feature
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface LevelSummary {
  readonly id: string;
  readonly title: string;
  readonly track: string;
  readonly description?: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly status: ContentStatusValue;
  readonly sectionId?: string;
  readonly color: string;
  readonly tags: string[];
  readonly parentId?: string;
  readonly lastModifiedBy?: string;
  readonly lastModifiedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly moduleCount: number;
}

export interface LevelDetailModule {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly difficulty?: string;
  readonly estimatedTime?: number;
  readonly order: number;
  readonly thumbnail?: string;
  readonly status: ContentStatusValue;
  readonly lessonCount: number;
}

export interface LevelDetail extends LevelSummary {
  readonly modules: LevelDetailModule[];
}

export interface LevelModuleItem {
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
  readonly lessonCount: number;
  readonly prerequisites: { readonly id: string; readonly title: string }[];
  readonly levelColor: string;
}

export interface LevelPrerequisiteItem {
  readonly id: string;
  readonly levelId: string;
  readonly levelTitle: string;
  readonly order: number;
  readonly isActive: boolean;
}

export interface LevelPrerequisitesView {
  readonly levelId: string;
  readonly levelTitle: string;
  readonly prerequisites: LevelPrerequisiteItem[];
  readonly dependentLevels: LevelPrerequisiteItem[];
}

export interface CanDeleteLevelResult {
  readonly canDelete: boolean;
  readonly reason?: string;
  readonly dependentLevels?: string[];
  readonly hasStudentProgress?: boolean;
}
