/*
 * Funcionalidad: Filtro de diferencias del historial de cambios
 * Descripción: Conserva solo los campos rastreados de un conjunto de cambios de dominio y construye el diff de desactivación usado por el historial de cambios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ChangeLogDiff } from "@/features/changelog/domain/entities/change-log-entry.entity";

export const DEACTIVATION_CHANGE_LOG_DIFF: ChangeLogDiff = { isActive: { before: true, after: false } };

export function pickTrackedChanges(changes: ChangeLogDiff, trackedFields: readonly string[]): ChangeLogDiff {
  const diff: ChangeLogDiff = {};

  for (const field of trackedFields) {
    const change: { before: unknown; after: unknown } | undefined = changes[field];

    if (change) {
      diff[field] = change;
    }
  }

  return diff;
}
