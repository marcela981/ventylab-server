/*
 * Funcionalidad: Utilidad isSuperadmin
 * Descripción: Indica si un correo corresponde al superadministrador configurado, sin distinguir mayúsculas ni espacios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export function isSuperadmin(email: string | null | undefined, superadminEmail: string | null | undefined): boolean {
  if (!email || !superadminEmail) {
    return false;
  }

  const normalizedSuperadminEmail: string = superadminEmail.trim().toLowerCase();

  return normalizedSuperadminEmail.length > 0 && email.trim().toLowerCase() === normalizedSuperadminEmail;
}
