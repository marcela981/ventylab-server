/*
 * Funcionalidad: Token ALLOWED_EMAIL_DOMAINS_TOKEN
 * Descripción: Token de inyección de la lista de dominios de correo permitidos para el inicio de sesión con Google (vacía = cualquier dominio)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const ALLOWED_EMAIL_DOMAINS_TOKEN: unique symbol = Symbol("ALLOWED_EMAIL_DOMAINS_TOKEN");

export function parseAllowedEmailDomains(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((domain: string) => domain.trim().replace(/^@/, "").toLowerCase())
    .filter((domain: string) => domain.length > 0);
}
