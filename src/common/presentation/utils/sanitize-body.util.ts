/*
 * Funcionalidad: Utilidad sanitizeBody
 * Descripción: Oculta contraseñas, tokens, credenciales y otros campos sensibles del cuerpo antes de registrarlo, en cualquier nivel de anidamiento y sin distinguir mayúsculas, mediante redactSecrets
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { redactSecrets } from "@/common/domain/utils/redact-secrets";

export function sanitizeBody(
  body: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!body || Object.keys(body).length === 0) {
    return null;
  }

  return redactSecrets(body) as Record<string, unknown>;
}
