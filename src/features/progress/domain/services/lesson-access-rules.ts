/*
 * Funcionalidad: Reglas de acceso secuencial a lecciones
 * Descripción: Decide si un estudiante puede abrir una lección: el módulo debe estar desbloqueado y todas las lecciones publicadas anteriores con al menos una página publicada deben estar completadas; las lecciones sin páginas publicadas no bloquean (se saltan, como en la navegación del visor)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LessonCompletionFact } from "@/features/curriculum/domain/read-models/lesson-completion.read-model";
import { isCompletableByPages, isLessonCompleted } from "@/features/curriculum/domain/services/lesson-completion-rules";
import {
  type LessonAccessDecision,
  MODULE_LOCKED_REASON,
  PREVIOUS_LESSON_INCOMPLETE_REASON,
  type SequenceLesson,
} from "@/features/progress/domain/read-models/lesson-access.read-model";

export const ALLOWED_LESSON_ACCESS: LessonAccessDecision = { allowed: true, missing: [] };

// Previous lessons still blocking the target, in lesson order. A lesson without facts or without published pages never blocks.
export function findMissingPreviousLessons(previousLessons: ReadonlyArray<SequenceLesson>, facts: ReadonlyArray<LessonCompletionFact>): SequenceLesson[] {
  const factsById: Map<string, LessonCompletionFact> = new Map(facts.map((fact: LessonCompletionFact): [string, LessonCompletionFact] => [fact.lessonId, fact]));

  return previousLessons.filter((lesson: SequenceLesson) => {
    const fact: LessonCompletionFact | undefined = factsById.get(lesson.lessonId);

    return fact !== undefined && isCompletableByPages(fact) && !isLessonCompleted(fact);
  });
}

export function decideLessonAccess(moduleUnlocked: boolean, missing: ReadonlyArray<SequenceLesson>): LessonAccessDecision {
  if (!moduleUnlocked) {
    return { allowed: false, reason: MODULE_LOCKED_REASON, missing: [] };
  }

  return missing.length > 0 ? { allowed: false, reason: PREVIOUS_LESSON_INCOMPLETE_REASON, missing: [...missing] } : ALLOWED_LESSON_ACCESS;
}
