/*
 * Funcionalidad: Resultado AuthenticatedUser
 * Descripción: Datos mínimos del usuario autenticado que comparten los inicios de sesión local y con Google. v1.1: sin el puente de NextAuth retirado v1.2: preferencia de apariencia (themeMode, themePalette)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ThemeModeValue, type ThemePaletteValue } from "@/features/users/domain/value-objects/theme-preference";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoleValue;
  image?: string;
  themeMode?: ThemeModeValue;
  themePalette?: ThemePaletteValue;
}
