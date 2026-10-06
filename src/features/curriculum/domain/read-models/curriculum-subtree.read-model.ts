/*
 * Funcionalidad: Modelos de lectura del subárbol curricular
 * Descripción: Define los tipos de nodo curricular (sección, nivel, módulo, lección, página), el conjunto de ids de un subárbol y el resultado de inspeccionarlo antes de eliminarlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DeleteDecision, type StudentDataCounts } from "@/features/curriculum/domain/services/delete-guard";

export type CurriculumNodeKind = "section" | "level" | "module" | "lesson" | "page";

export const SECTION_NODE_KIND: CurriculumNodeKind = "section";
export const LEVEL_NODE_KIND: CurriculumNodeKind = "level";
export const MODULE_NODE_KIND: CurriculumNodeKind = "module";
export const LESSON_NODE_KIND: CurriculumNodeKind = "lesson";
export const PAGE_NODE_KIND: CurriculumNodeKind = "page";

export interface CurriculumSubtree {
  readonly sectionIds: string[];
  readonly levelIds: string[];
  readonly moduleIds: string[];
  readonly lessonIds: string[];
  readonly pageIds: string[];
}

export interface CurriculumDeleteInspection {
  readonly subtree: CurriculumSubtree;
  readonly studentData: StudentDataCounts;
  readonly decision: DeleteDecision;
}
