/*
 * Funcionalidad: Reglas de acceso a media
 * Descripción: Decide quién gestiona cualquier archivo de media (administradores), quién es personal docente con acceso completo de lectura y si un estudiante puede obtener la URL firmada de un archivo según el contenido publicado que lo referencia
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ADMIN_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";

export const MEDIA_READ_PERMISSION: string = "media:read";

export interface MediaRequester {
  userId: string;
  role: string;
  permissions: readonly string[];
}

export function canManageAllMedia(requester: MediaRequester): boolean {
  return requester.role === ADMIN_ROLE_VALUE;
}

export function isMediaStaff(requester: MediaRequester): boolean {
  return requester.role === ADMIN_ROLE_VALUE || requester.permissions.includes(MEDIA_READ_PERMISSION);
}

export async function canReadMediaURL(
  requester: MediaRequester,
  isReferencedByPublishedContent: () => Promise<boolean>,
): Promise<boolean> {
  if (isMediaStaff(requester)) {
    return true;
  }

  return await isReferencedByPublishedContent();
}
