/*
 * Funcionalidad: Permisos por rol
 * Descripción: Asocia cada rol de usuario con su conjunto de permisos y los resuelve
 * Versión: 1.11
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { PERMISSION_CATALOG, type PermissionValue } from "@/features/authorization/domain/permission-catalog";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

const STUDENT_PERMISSIONS: readonly PermissionValue[] = [
  "sections:read",
  "levels:read",
  "modules:read",
  "lessons:read",
  "steps:read",
  "pages:read",
  "curriculum:read",
  "progress:read_own",
  "progress:update_own",
  "quizzes:read",
  "quizzes:attempt",
  "clinical-cases:read",
  "clinical-cases:evaluate",
  "activities:read",
  "activity-submissions:read_own",
  "activity-submissions:create_own",
  "activity-submissions:update_own",
  "scores:read_own",
  "notes:read_own",
  "notes:create_own",
  "notes:update_own",
  "notes:delete_own",
  "simulation:read",
  "simulation:control",
  "groups:read_own",
  "evaluations:attempt",
  "ai-ratings:create_own",
  "ai-tutor:use",
];

const TEACHER_PERMISSIONS: readonly PermissionValue[] = [
  ...STUDENT_PERMISSIONS,
  "users:list",
  "students:read",
  "teacher-students:read",
  "sections:create",
  "sections:update",
  "levels:create",
  "levels:update",
  "modules:create",
  "modules:update",
  "lessons:create",
  "lessons:update",
  "steps:create",
  "steps:update",
  "pages:create",
  "pages:update",
  "curriculum:manage",
  "overrides:read",
  "overrides:create",
  "overrides:update",
  "overrides:delete",
  "changelog:read",
  "progress:read",
  "quizzes:manage",
  "activities:create",
  "activities:update",
  "activities:delete",
  "activities:publish",
  "activity-assignments:read",
  "activity-assignments:create",
  "activity-assignments:delete",
  "activity-submissions:read",
  "activity-submissions:grade",
  "activity-submissions:reset",
  "groups:read",
  "groups:create",
  "groups:update",
  "groups:delete",
  "groups:manage_members",
  "scores:read",
  "scores:create",
  "scores:delete",
  "admin-statistics:read",
  "media:create",
  "media:read",
  "media:delete",
  "evaluations:read",
  "evaluations:manage",
  "evaluations:assign",
  "evaluations:grade",
  "ai-ratings:read",
];

export const ROLE_PERMISSIONS: Readonly<Record<UserRoleValue, readonly PermissionValue[]>> = {
  STUDENT: STUDENT_PERMISSIONS,
  TEACHER: TEACHER_PERMISSIONS,
  ADMIN: PERMISSION_CATALOG,
};

export function resolveRolePermissions(role: UserRoleValue): PermissionValue[] {
  return [...new Set<PermissionValue>(ROLE_PERMISSIONS[role])];
}
