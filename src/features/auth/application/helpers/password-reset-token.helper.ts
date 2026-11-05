/*
 * Funcionalidad: Utilidades del token de recuperación de contraseña
 * Descripción: Genera el token aleatorio del enlace de recuperación (32 bytes, base64url), calcula su hash SHA-256 (lo único que se guarda), su vencimiento (30 minutos) y el enlace a /auth/reset-password de la web
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES: number = 32;
export const PASSWORD_RESET_TOKEN_TTL_MS: number = 30 * 60 * 1000;
export const PASSWORD_RESET_PATH: string = "/auth/reset-password";

export function generatePasswordResetToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetExpiry(now: Date): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);
}

// frontendUrl: FRONTEND_URL (the first origin when it lists several).
export function passwordResetLink(frontendUrl: string, token: string): string {
  const origin: string = (frontendUrl.split(",")[0] ?? "").trim().replace(/\/+$/, "");

  return `${origin}${PASSWORD_RESET_PATH}?token=${encodeURIComponent(token)}`;
}
