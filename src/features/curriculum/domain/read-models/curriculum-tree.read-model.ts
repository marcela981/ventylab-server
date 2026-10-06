/*
 * Funcionalidad: Modelos de lectura del árbol curricular del estudiante
 * Descripción: Define las fuentes de datos para calcular el desbloqueo (niveles, módulos, aristas de prerrequisitos y módulos completados) y el árbol Sección, Nivel, Módulo con locked y missingPrerequisites
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrerequisiteEdge } from "@/features/curriculum/domain/services/prerequisite-graph";
import { type NamedReference, type UnlockState } from "@/features/curriculum/domain/services/unlock-rules";
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export interface CurriculumUnlockSource {
  readonly levels: { readonly id: string; readonly title: string; readonly moduleIds: string[] }[];
  readonly modules: { readonly id: string; readonly title: string; readonly levelId?: string }[];
  readonly levelEdges: PrerequisiteEdge[];
  readonly moduleEdges: PrerequisiteEdge[];
  readonly completedModuleIds: string[];
}

export interface CurriculumUnlockState {
  readonly levels: ReadonlyMap<string, UnlockState>;
  readonly modules: ReadonlyMap<string, UnlockState>;
  readonly completedLevelIds: ReadonlySet<string>;
  readonly completedModuleIds: ReadonlySet<string>;
}

export interface CurriculumTreeSourceModule {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly lessonCount: number;
}

export interface CurriculumTreeSourceLevel {
  readonly id: string;
  readonly sectionId?: string;
  readonly title: string;
  readonly description?: string;
  readonly track: string;
  readonly order: number;
  readonly status: ContentStatusValue;
  readonly modules: CurriculumTreeSourceModule[];
}

export interface CurriculumTreeSourceSection {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly status: ContentStatusValue;
}

export interface CurriculumTreeSource {
  readonly sections: CurriculumTreeSourceSection[];
  readonly levels: CurriculumTreeSourceLevel[];
}

export interface StudentTreeModule extends CurriculumTreeSourceModule {
  readonly locked: boolean;
  readonly completed: boolean;
  readonly missingPrerequisites: NamedReference[];
}

export interface StudentTreeLevel extends Omit<CurriculumTreeSourceLevel, "modules"> {
  readonly locked: boolean;
  readonly completed: boolean;
  readonly missingPrerequisites: NamedReference[];
  readonly modules: StudentTreeModule[];
}

export interface StudentTreeSection extends CurriculumTreeSourceSection {
  readonly levels: StudentTreeLevel[];
}

export interface StudentCurriculumTree {
  readonly sections: StudentTreeSection[];
  readonly unsectionedLevels: StudentTreeLevel[];
}
