/*
 * Funcionalidad: Estado de publicación del contenido curricular
 * Descripción: Define los valores DRAFT, PUBLISHED y ARCHIVED compartidos por secciones, niveles, módulos, lecciones y páginas, y la regla que mantiene sincronizado isActive con el estado (ARCHIVED equivale a isActive = false)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ContentStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export const DRAFT_CONTENT_STATUS: ContentStatusValue = "DRAFT";
export const PUBLISHED_CONTENT_STATUS: ContentStatusValue = "PUBLISHED";
export const ARCHIVED_CONTENT_STATUS: ContentStatusValue = "ARCHIVED";

export const CONTENT_STATUS_VALUES: readonly ContentStatusValue[] = [DRAFT_CONTENT_STATUS, PUBLISHED_CONTENT_STATUS, ARCHIVED_CONTENT_STATUS] as const;

export interface ContentStatusState {
  readonly status: ContentStatusValue;
  readonly isActive: boolean;
}

export function isActiveForStatus(status: ContentStatusValue): boolean {
  return status !== ARCHIVED_CONTENT_STATUS;
}

export function resolveContentStatus({
  currentStatus,
  status,
  isActive,
}: {
  currentStatus: ContentStatusValue;
  status?: ContentStatusValue;
  isActive?: boolean;
}): ContentStatusState {
  if (status !== undefined) {
    return { status, isActive: isActiveForStatus(status) };
  }

  if (isActive === false) {
    return { status: ARCHIVED_CONTENT_STATUS, isActive: false };
  }

  if (isActive === true && currentStatus === ARCHIVED_CONTENT_STATUS) {
    return { status: PUBLISHED_CONTENT_STATUS, isActive: true };
  }

  return { status: currentStatus, isActive: isActiveForStatus(currentStatus) };
}
