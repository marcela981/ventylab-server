/*
 * Funcionalidad: Resultado AuthenticatedUser
 * Descripción: Datos mínimos del usuario autenticado que comparten los inicios de sesión local, con Google y del puente de NextAuth
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoleValue;
  image?: string;
}
