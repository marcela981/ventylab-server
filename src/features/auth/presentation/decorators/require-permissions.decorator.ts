/*
 * Funcionalidad: Decorador RequirePermissions
 * Descripción: Declara los permisos requeridos por una ruta para PermissionsGuard
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SetMetadata } from "@nestjs/common";

import { type PermissionValue } from "@/features/authorization/domain/permission-catalog";

export const PERMISSIONS_KEY: string = "permissions";

export const RequirePermissions = (...permissions: PermissionValue[]): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
