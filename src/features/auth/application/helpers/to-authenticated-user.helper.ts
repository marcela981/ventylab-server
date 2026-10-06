/*
 * Funcionalidad: Utilidad toAuthenticatedUser
 * Descripción: Convierte la entidad User en el AuthenticatedUser que usan los resultados y respuestas de autenticación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";
import { type User } from "@/features/users/domain/entities/user.entity";

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.value,
    image: user.image,
  };
}
