/*
 * Funcionalidad: Línea de tiempo de actividad
 * Descripción: Tipos de las entradas de la línea de tiempo de un estudiante (lección completada, evaluación iniciada o entregada, sesión de simulación y reserva del ventilador) y función pura que fusiona las entradas de todas las fuentes, las ordena de la más reciente a la más antigua (desempate estable por tipo y referencia) y las acota a un máximo informando si se recortaron
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type TimelineEntryKindValue = "LESSON_COMPLETED" | "EVALUATION_STARTED" | "EVALUATION_SUBMITTED" | "SIMULATION_SESSION" | "RESERVATION";

export const TIMELINE_ENTRY_KIND_VALUES: readonly TimelineEntryKindValue[] = [
  "LESSON_COMPLETED",
  "EVALUATION_STARTED",
  "EVALUATION_SUBMITTED",
  "SIMULATION_SESSION",
  "RESERVATION",
] as const;

export interface TimelineEntry {
  readonly kind: TimelineEntryKindValue;
  readonly occurredAt: Date;
  readonly referenceId: string;
  readonly title?: string;
  readonly status?: string;
  readonly value?: number;
  readonly endedAt?: Date;
}

export interface MergedTimeline {
  readonly entries: TimelineEntry[];
  readonly truncated: boolean;
}

export function mergeTimeline(sources: ReadonlyArray<ReadonlyArray<TimelineEntry>>, limit: number): MergedTimeline {
  const entries: TimelineEntry[] = sources
    .flat()
    .sort(
      (left: TimelineEntry, right: TimelineEntry) =>
        right.occurredAt.getTime() - left.occurredAt.getTime() || left.kind.localeCompare(right.kind) || left.referenceId.localeCompare(right.referenceId),
    );

  return { entries: entries.slice(0, limit), truncated: entries.length > limit };
}
