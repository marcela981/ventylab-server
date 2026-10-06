/*
 * Funcionalidad: Reglas de completitud por páginas
 * Descripción: Regla única de lección completada (todas sus páginas publicadas vistas, o un registro histórico de completitud que nunca se degrada), progreso ponderado por lecciones y módulos completados; la comparten currículo, niveles y progreso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact, type LessonWeightedProgress } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";

export function isCompletableByPages(fact: LessonCompletionFact): boolean {
  return fact.publishedPageCount > 0;
}

export function areAllPagesViewed(fact: LessonCompletionFact): boolean {
  return isCompletableByPages(fact) && fact.viewedPageCount >= fact.publishedPageCount;
}

export function isLessonCompleted(fact: LessonCompletionFact): boolean {
  return fact.hasCompletionRecord || areAllPagesViewed(fact);
}

export function computeLessonWeightedProgress(completedLessons: number, totalLessons: number): LessonWeightedProgress {
  const percentage: number = totalLessons > 0 ? Math.floor((completedLessons / totalLessons) * 100) : 0;

  return { completedLessons, totalLessons, percentage, completed: totalLessons > 0 && completedLessons >= totalLessons };
}

export function summarizeLessons(facts: ReadonlyArray<LessonCompletionFact>): LessonWeightedProgress {
  return computeLessonWeightedProgress(facts.filter((fact: LessonCompletionFact) => isLessonCompleted(fact)).length, facts.length);
}

export function completedModuleIdsOf(facts: ReadonlyArray<LessonCompletionFact>): string[] {
  const factsByModule: Map<string, LessonCompletionFact[]> = new Map();

  for (const fact of facts) {
    factsByModule.set(fact.moduleId, [...(factsByModule.get(fact.moduleId) ?? []), fact]);
  }

  return Array.from(factsByModule.entries())
    .filter(([, moduleFacts]: [string, LessonCompletionFact[]]) => summarizeLessons(moduleFacts).completed)
    .map(([moduleId]: [string, LessonCompletionFact[]]) => moduleId);
}
