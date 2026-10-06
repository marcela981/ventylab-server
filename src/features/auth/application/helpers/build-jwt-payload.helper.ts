/*
 * Funcionalidad: Utilidad buildJwtPayload
 * Descripción: Construye el payload del JWT con id, correo, rol y permisos resueltos del usuario autenticado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";
import { resolveRolePermissions } from "@/features/authorization/domain/role-permissions";

export function buildJwtPayload(user: AuthenticatedUser): JwtPayload {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: resolveRolePermissions(user.role),
  };
}
