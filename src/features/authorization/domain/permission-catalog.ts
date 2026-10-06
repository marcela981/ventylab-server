/*
 * Funcionalidad: Catálogo de permisos
 * Descripción: Define todos los permisos recurso:acción del sistema
 * Versión: 1.8
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type PermissionValue =
  | "users:read"
  | "users:list"
  | "users:update_role"
  | "users:update_status"
  | "students:read"
  | "students:read_all"
  | "teacher-students:read"
  | "teacher-students:manage"
  | "sections:read"
  | "sections:create"
  | "sections:update"
  | "sections:delete"
  | "levels:read"
  | "levels:create"
  | "levels:update"
  | "levels:delete"
  | "modules:read"
  | "modules:create"
  | "modules:update"
  | "modules:delete"
  | "lessons:read"
  | "lessons:create"
  | "lessons:update"
  | "lessons:delete"
  | "steps:read"
  | "steps:create"
  | "steps:update"
  | "steps:delete"
  | "pages:read"
  | "pages:create"
  | "pages:update"
  | "pages:delete"
  | "curriculum:read"
  | "curriculum:manage"
  | "overrides:read"
  | "overrides:create"
  | "overrides:update"
  | "overrides:delete"
  | "changelog:read"
  | "progress:read_own"
  | "progress:update_own"
  | "progress:read"
  | "quizzes:read"
  | "quizzes:attempt"
  | "quizzes:manage"
  | "clinical-cases:read"
  | "clinical-cases:evaluate"
  | "activities:read"
  | "activities:create"
  | "activities:update"
  | "activities:delete"
  | "activities:publish"
  | "activity-assignments:read"
  | "activity-assignments:create"
  | "activity-assignments:delete"
  | "activity-submissions:read_own"
  | "activity-submissions:create_own"
  | "activity-submissions:update_own"
  | "activity-submissions:read"
  | "activity-submissions:grade"
  | "activity-submissions:reset"
  | "groups:read"
  | "groups:read_own"
  | "groups:create"
  | "groups:update"
  | "groups:delete"
  | "groups:manage_members"
  | "groups:manage_supervisions"
  | "scores:read_own"
  | "scores:read"
  | "scores:create"
  | "scores:delete"
  | "admin-statistics:read"
  | "media:create"
  | "media:read"
  | "media:delete"
  | "notes:read_own"
  | "notes:create_own"
  | "notes:update_own"
  | "notes:delete_own"
  | "simulation:read"
  | "simulation:control"
  | "evaluations:read"
  | "evaluations:manage"
  | "evaluations:assign"
  | "evaluations:attempt"
  | "evaluations:grade";

export const PERMISSION_CATALOG: readonly PermissionValue[] = [
  "users:read",
  "users:list",
  "users:update_role",
  "users:update_status",
  "students:read",
  "students:read_all",
  "teacher-students:read",
  "teacher-students:manage",
  "sections:read",
  "sections:create",
  "sections:update",
  "sections:delete",
  "levels:read",
  "levels:create",
  "levels:update",
  "levels:delete",
  "modules:read",
  "modules:create",
  "modules:update",
  "modules:delete",
  "lessons:read",
  "lessons:create",
  "lessons:update",
  "lessons:delete",
  "steps:read",
  "steps:create",
  "steps:update",
  "steps:delete",
  "pages:read",
  "pages:create",
  "pages:update",
  "pages:delete",
  "curriculum:read",
  "curriculum:manage",
  "overrides:read",
  "overrides:create",
  "overrides:update",
  "overrides:delete",
  "changelog:read",
  "progress:read_own",
  "progress:update_own",
  "progress:read",
  "quizzes:read",
  "quizzes:attempt",
  "quizzes:manage",
  "clinical-cases:read",
  "clinical-cases:evaluate",
  "activities:read",
  "activities:create",
  "activities:update",
  "activities:delete",
  "activities:publish",
  "activity-assignments:read",
  "activity-assignments:create",
  "activity-assignments:delete",
  "activity-submissions:read_own",
  "activity-submissions:create_own",
  "activity-submissions:update_own",
  "activity-submissions:read",
  "activity-submissions:grade",
  "activity-submissions:reset",
  "groups:read",
  "groups:read_own",
  "groups:create",
  "groups:update",
  "groups:delete",
  "groups:manage_members",
  "groups:manage_supervisions",
  "scores:read_own",
  "scores:read",
  "scores:create",
  "scores:delete",
  "admin-statistics:read",
  "media:create",
  "media:read",
  "media:delete",
  "notes:read_own",
  "notes:create_own",
  "notes:update_own",
  "notes:delete_own",
  "simulation:read",
  "simulation:control",
  "evaluations:read",
  "evaluations:manage",
  "evaluations:assign",
  "evaluations:attempt",
  "evaluations:grade",
] as const;
