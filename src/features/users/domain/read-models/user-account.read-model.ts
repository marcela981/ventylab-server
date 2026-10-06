/*
 * Funcionalidad: Modelo de lectura UserAccount
 * Descripción: Vista de solo lectura de la cuenta de un usuario que UsersFacade entrega a otras features (rol, estado activo, vínculo con Google y revocación de refresh tokens)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  role: UserRoleValue;
  image?: string;
  isActive: boolean;
  googleId?: string;
  hasPassword: boolean;
  refreshTokensRevokedAt?: Date;
  createdAt: Date;
}
