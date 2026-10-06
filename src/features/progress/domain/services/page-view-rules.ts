/*
 * Funcionalidad: Reglas de registro de vista de página
 * Descripción: Decide la escritura idempotente de una vista de página (la primera vista fija completedAt y las siguientes solo actualizan lastVisitedAt) y si una vista acaba de completar la lección según la regla de completitud por páginas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { areAllPagesViewed } from "@/features/curriculum/domain/services/lesson-completion-rules";
import { type PageViewSnapshot, type PageViewWrite } from "@/features/progress/domain/read-models/learning-progress.read-model";

export function decidePageView(existing: PageViewSnapshot | undefined, now: Date): PageViewWrite {
  if (existing?.completed === true && existing.firstViewedAt !== undefined) {
    return { lastVisitedAt: now };
  }

  return { lastVisitedAt: now, completedAt: existing?.firstViewedAt ?? now };
}

export function shouldRecordLessonCompletion(fact: LessonCompletionFact | undefined): boolean {
  return fact !== undefined && !fact.hasCompletionRecord && areAllPagesViewed(fact);
}
