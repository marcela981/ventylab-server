/*
 * Funcionalidad: Decorador AllowSelfOr
 * Descripción: Declara el parámetro de ruta que identifica al propio usuario y los permisos alternativos que evalúa SelfOrPermissionGuard
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { SetMetadata } from "@nestjs/common";

import { type PermissionValue } from "@/features/authorization/domain/permission-catalog";

export const SELF_OR_PERMISSIONS_KEY: string = "selfOrPermissions";

export interface SelfOrPermissionsMetadata {
  paramKey: string;
  permissions: PermissionValue[];
}

export const AllowSelfOr = (paramKey: string, ...permissions: PermissionValue[]): MethodDecorator & ClassDecorator =>
  SetMetadata<string, SelfOrPermissionsMetadata>(SELF_OR_PERMISSIONS_KEY, { paramKey, permissions });
