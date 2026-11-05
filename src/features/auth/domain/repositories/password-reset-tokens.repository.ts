/*
 * Funcionalidad: Repositorio IPasswordResetTokensRepository
 * Descripción: Contrato y token de inyección de los tokens de recuperación de contraseña (Ajustes D3): alta con el hash SHA-256, invalidación de los pendientes de un usuario, búsqueda de uno vigente por hash y consumo de un solo uso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN: unique symbol = Symbol("PASSWORD_RESET_TOKENS_REPOSITORY_TOKEN");

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
}

export interface IPasswordResetTokensRepository {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }, transaction?: unknown): Promise<void>;
  /** Marks every unused token of the user as used (a new request replaces the previous links). */
  invalidateForUser(userId: string, now: Date, transaction?: unknown): Promise<void>;
  /** The unused, unexpired token with that hash, if any. */
  findValid(tokenHash: string, now: Date, transaction?: unknown): Promise<PasswordResetTokenRecord | undefined>;
  /** Marks the token as used; false when another request consumed it first. */
  consume(id: string, now: Date, transaction?: unknown): Promise<boolean>;
}
