/*
 * Funcionalidad: Utilidad toAuthenticatedUser
 * Descripción: Convierte la entidad User en el AuthenticatedUser que usan los resultados y respuestas de autenticación, con la imagen ya resuelta (foto subida o imagen guardada, UsersFacade.resolveImage) v1.2: incluye la preferencia de apariencia
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";
import { type User } from "@/features/users/domain/entities/user.entity";

// image: the resolved photo (UsersFacade.resolveImage), never the raw stored column, so the session shows the same image as UserDTO.
export function toAuthenticatedUser(user: User, image: string | undefined): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.value,
    image,
    themeMode: user.themeMode,
    themePalette: user.themePalette,
  };
}
