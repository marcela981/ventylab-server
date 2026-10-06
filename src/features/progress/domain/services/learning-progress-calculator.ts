/*
 * Funcionalidad: Calculadora de progreso ponderado por lecciones
 * Descripción: Construye en memoria el progreso de lecciones, módulos, niveles y secciones a partir de la estructura publicada y de los hechos de completitud por páginas; nivel y sección se ponderan por lecciones (no promedian porcentajes de módulos)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { areAllPagesViewed, isLessonCompleted, summarizeLessons } from "@/features/curriculum/domain/services/lesson-completion-rules";
import {
  type LearningProgressReport,
  type LessonLearningProgress,
  type LevelLearningProgress,
  type ModuleLearningProgress,
  type ProgressStructure,
  type ProgressStructureLevel,
  type ProgressStructureModule,
  type ProgressStructureSection,
  type SectionLearningProgress,
} from "@/features/progress/domain/read-models/learning-progress.read-model";

export function toLessonLearningProgress(fact: LessonCompletionFact): LessonLearningProgress {
  return {
    lessonId: fact.lessonId,
    moduleId: fact.moduleId,
    viewedPages: Math.min(fact.viewedPageCount, fact.publishedPageCount),
    totalPages: fact.publishedPageCount,
    completedByPages: areAllPagesViewed(fact),
    completed: isLessonCompleted(fact),
  };
}

function groupFactsByModule(facts: ReadonlyArray<LessonCompletionFact>): Map<string, LessonCompletionFact[]> {
  const groups: Map<string, LessonCompletionFact[]> = new Map();

  for (const fact of facts) {
    groups.set(fact.moduleId, [...(groups.get(fact.moduleId) ?? []), fact]);
  }

  return groups;
}

function buildModuleProgress(module: ProgressStructureModule, facts: LessonCompletionFact[]): ModuleLearningProgress {
  return {
    moduleId: module.id,
    levelId: module.levelId,
    ...summarizeLessons(facts),
    lessons: facts.map((fact: LessonCompletionFact) => toLessonLearningProgress(fact)),
  };
}

export function buildLearningProgressReport(structure: ProgressStructure, facts: ReadonlyArray<LessonCompletionFact>): LearningProgressReport {
  const factsByModule: Map<string, LessonCompletionFact[]> = groupFactsByModule(facts);
  const factsOfModules = (moduleIds: ReadonlyArray<string>): LessonCompletionFact[] => moduleIds.flatMap((moduleId: string) => factsByModule.get(moduleId) ?? []);

  const modules: ModuleLearningProgress[] = structure.modules.map((module: ProgressStructureModule) => buildModuleProgress(module, factsByModule.get(module.id) ?? []));
  const moduleById: Map<string, ModuleLearningProgress> = new Map(modules.map((module: ModuleLearningProgress): [string, ModuleLearningProgress] => [module.moduleId, module]));

  const levels: LevelLearningProgress[] = structure.levels.map((level: ProgressStructureLevel): LevelLearningProgress => {
    const levelModules: ModuleLearningProgress[] = level.moduleIds.map(
      (moduleId: string) => moduleById.get(moduleId) ?? buildModuleProgress({ id: moduleId, levelId: level.id }, factsByModule.get(moduleId) ?? []),
    );

    return {
      levelId: level.id,
      sectionId: level.sectionId,
      ...summarizeLessons(factsOfModules(level.moduleIds)),
      completedModules: levelModules.filter((module: ModuleLearningProgress) => module.completed).length,
      totalModules: levelModules.length,
      modules: levelModules,
    };
  });

  const levelById: Map<string, LevelLearningProgress> = new Map(levels.map((level: LevelLearningProgress): [string, LevelLearningProgress] => [level.levelId, level]));
  const moduleIdsByLevel: Map<string, string[]> = new Map(structure.levels.map((level: ProgressStructureLevel): [string, string[]] => [level.id, level.moduleIds]));

  const sections: SectionLearningProgress[] = structure.sections.map((section: ProgressStructureSection): SectionLearningProgress => {
    const sectionLevels: LevelLearningProgress[] = section.levelIds
      .map((levelId: string) => levelById.get(levelId))
      .filter((level: LevelLearningProgress | undefined): level is LevelLearningProgress => level !== undefined);
    const sectionModuleIds: string[] = section.levelIds.flatMap((levelId: string) => moduleIdsByLevel.get(levelId) ?? []);

    return {
      sectionId: section.id,
      ...summarizeLessons(factsOfModules(sectionModuleIds)),
      completedLevels: sectionLevels.filter((level: LevelLearningProgress) => level.completed).length,
      totalLevels: sectionLevels.length,
      levels: sectionLevels,
    };
  });

  const overall: LessonWeightedProgress = summarizeLessons(facts);

  return { overall, modules, levels, sections };
}
