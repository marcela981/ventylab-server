/*
 * Funcionalidad: Regla de visibilidad del contenido curricular
 * Descripción: Decide si una entidad curricular es visible según la cadena de estados de sus ancestros (Sección, Nivel, Módulo, Lección, Página) y si el lector puede gestionar el recurso (permiso *:update)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue, PUBLISHED_CONTENT_STATUS } from "@/features/curriculum/domain/value-objects/content-status";

export type ContentStatusChain = ReadonlyArray<ContentStatusValue | undefined>;

export function isVisibleToStudent(chain: ContentStatusChain): boolean {
  return chain.every((status: ContentStatusValue | undefined) => status === undefined || status === PUBLISHED_CONTENT_STATUS);
}

export function isContentVisible(canManage: boolean, chain: ContentStatusChain): boolean {
  return canManage || isVisibleToStudent(chain);
}

export function canManageContent(permissions: ReadonlyArray<string> | undefined, managePermission: string): boolean {
  return permissions?.includes(managePermission) ?? false;
}
