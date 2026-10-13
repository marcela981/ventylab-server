/*
 * Funcionalidad: Matriz de autorización de rutas HTTP
 * Descripción: Tabla declarativa "<MÉTODO> <ruta registrada>" → resultado esperado por actor (anónimo, estudiante, docente, administrador, superadministrador) derivada de los guards (@UseGuards), @RequirePermissions/@AllowSelfOr de cada controlador y de ROLE_PERMISSIONS; la consumen las pruebas e2e de la matriz y de cobertura del registro de rutas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type Actor = "anonymous" | "student" | "teacher" | "admin" | "superadmin";

export const ACTORS: readonly Actor[] = ["anonymous", "student", "teacher", "admin", "superadmin"];

// "allow" means the guards let the request through: any status except 401 and 403 (400/404/409 from validation or missing data are fine).
export type Outcome = 401 | 403 | 404 | "allow";

export type ActorOutcomes = Readonly<Record<Actor, Outcome>>;

// No guard, or OptionalJwtAuthGuard.
const PUBLIC: ActorOutcomes = { anonymous: "allow", student: "allow", teacher: "allow", admin: "allow", superadmin: "allow" };

// JwtAuthGuard alone, or JwtAuthGuard + PermissionsGuard without @RequirePermissions.
const AUTHENTICATED: ActorOutcomes = { anonymous: 401, student: "allow", teacher: "allow", admin: "allow", superadmin: "allow" };

// The permission is held by STUDENT (and therefore by TEACHER and ADMIN).
const STUDENT_UP: ActorOutcomes = AUTHENTICATED;

// The permission is held by TEACHER and ADMIN.
const TEACHER_UP: ActorOutcomes = { anonymous: 401, student: 403, teacher: "allow", admin: "allow", superadmin: "allow" };

// The permission is held by ADMIN only (ADMIN holds the full catalog; the superadmin is an ADMIN).
const ADMIN_ONLY: ActorOutcomes = { anonymous: 401, student: 403, teacher: 403, admin: "allow", superadmin: "allow" };

// NextAuthBridgeGuard: only the server-to-server bridge secret header opens it; a JWT never does.
const BRIDGE_SECRET_ONLY: ActorOutcomes = { anonymous: 401, student: 401, teacher: 401, admin: 401, superadmin: 401 };

// Guards pass, but the use case answers 403 to callers whose role is not STUDENT.
const STUDENT_ROLE_ONLY: ActorOutcomes = { anonymous: 401, student: "allow", teacher: 403, admin: 403, superadmin: 403 };

// Guards pass, but the use case answers 403 unless the caller holds the active reservation (none exists in the matrix run).
const RESERVATION_HOLDER_ONLY: ActorOutcomes = { anonymous: 401, student: 403, teacher: 403, admin: 403, superadmin: 403 };

// Comments name the guard or the required permissions read from the controller decorators.
export const AUTHORIZATION_MATRIX: Readonly<Record<string, ActorOutcomes>> = {
  // activities
  "DELETE /api/activities/:id": TEACHER_UP, // activities:delete
  "DELETE /api/activity-assignments/:id": TEACHER_UP, // activity-assignments:delete
  "DELETE /api/activity-submissions/:id/reset": TEACHER_UP, // activity-submissions:reset
  "GET /api/activities": STUDENT_UP, // activities:read
  "GET /api/activities/:id": STUDENT_UP, // activities:read
  "GET /api/activities/:id/submissions": TEACHER_UP, // activity-submissions:read
  "GET /api/activities/catalog": STUDENT_UP, // activities:read
  "GET /api/activities/catalog/:id": STUDENT_UP, // activities:read
  "GET /api/activity-assignments": TEACHER_UP, // activity-assignments:read
  "GET /api/activity-submissions/:id": STUDENT_UP, // activity-submissions:read_own
  "GET /api/activity-submissions/for-activity/:activityId": STUDENT_UP, // activity-submissions:read_own
  "GET /api/activity-submissions/my": STUDENT_UP, // activity-submissions:read_own
  "POST /api/activities": TEACHER_UP, // activities:create
  "POST /api/activities/:id/publish": TEACHER_UP, // activities:publish
  "POST /api/activity-assignments": TEACHER_UP, // activity-assignments:create
  "POST /api/activity-submissions": STUDENT_UP, // activity-submissions:create_own
  "POST /api/activity-submissions/:id/submit": STUDENT_ROLE_ONLY, // activity-submissions:update_own; use case throws StudentRoleRequiredError (403) for non-students
  "PUT /api/activities/:id": TEACHER_UP, // activities:update
  "PUT /api/activity-submissions/:id": STUDENT_ROLE_ONLY, // activity-submissions:update_own; use case throws StudentRoleRequiredError (403) for non-students
  "PUT /api/activity-submissions/:id/grade": TEACHER_UP, // activity-submissions:grade

  // admin
  "GET /api/admin/statistics": TEACHER_UP, // admin-statistics:read
  "GET /api/admin/students": TEACHER_UP, // students:read
  "GET /api/admin/students/:id/progress": TEACHER_UP, // students:read
  "GET /api/admin/teachers": ADMIN_ONLY, // users:read
  "PATCH /api/admin/users/:id/role": ADMIN_ONLY, // users:update_role

  // ai-ratings
  "GET /api/admin/ai-ratings/export.csv": TEACHER_UP, // ai-ratings:read
  "GET /api/admin/ai-ratings/stats": TEACHER_UP, // ai-ratings:read
  "GET /api/ai-ratings/mine": STUDENT_UP, // ai-ratings:create_own
  "PUT /api/ai-ratings": STUDENT_UP, // ai-ratings:create_own

  // ai-telemetry
  "GET /api/admin/ai-telemetry/export.csv": ADMIN_ONLY, // ai-telemetry:read
  "GET /api/admin/ai-telemetry/stats": ADMIN_ONLY, // ai-telemetry:read

  // ai-tutor
  "DELETE /api/tutor/conversations/:conversationId": STUDENT_UP, // ai-tutor:use
  "GET /api/tutor/conversations": STUDENT_UP, // ai-tutor:use
  "GET /api/tutor/conversations/:conversationId": STUDENT_UP, // ai-tutor:use
  "PATCH /api/tutor/conversations/:conversationId": STUDENT_UP, // ai-tutor:use
  "POST /api/tutor/conversations": STUDENT_UP, // ai-tutor:use
  "POST /api/tutor/conversations/:conversationId/messages": STUDENT_UP, // ai-tutor:use
  "POST /api/tutor/pages/:pageId/deepen": STUDENT_UP, // ai-tutor:use

  // analytics
  "GET /api/analytics/evaluations/:evaluationId/stats": TEACHER_UP, // analytics:read
  "GET /api/analytics/groups/:groupId/dashboard": TEACHER_UP, // analytics:read
  "GET /api/analytics/groups/:groupId/export.csv": TEACHER_UP, // analytics:read
  "GET /api/analytics/research/export.csv": ADMIN_ONLY, // analytics:research-export
  "GET /api/analytics/students/:userId/timeline": { ...TEACHER_UP, teacher: 403 }, // analytics:read; a teacher only sees STUDENT members of their groups (403 otherwise)
  "GET /api/me/summary": AUTHENTICATED, // JwtAuthGuard

  // audit-log
  "GET /api/audit": ADMIN_ONLY, // audit:read
  "GET /api/audit/export": ADMIN_ONLY, // audit:read
  "GET /api/audit/targets/:type/:id": ADMIN_ONLY, // audit:read

  // auth
  "GET /api/auth/me": AUTHENTICATED, // JwtAuthGuard
  "POST /api/auth/google": PUBLIC, // no guard
  "POST /api/auth/login": PUBLIC, // no guard
  "POST /api/auth/logout": AUTHENTICATED, // JwtAuthGuard
  "POST /api/auth/nextauth-token": BRIDGE_SECRET_ONLY, // NextAuthBridgeGuard (x-nextauth-bridge-secret)
  "POST /api/auth/refresh": PUBLIC, // no guard
  "POST /api/auth/register": PUBLIC, // no guard

  // authorization
  "GET /api/authorization/permissions": AUTHENTICATED, // JwtAuthGuard
  "GET /api/authorization/roles": AUTHENTICATED, // JwtAuthGuard

  // changelog
  "GET /api/changelog": TEACHER_UP, // changelog:read
  "GET /api/changelog/:entityType/:entityId": TEACHER_UP, // changelog:read
  "GET /api/changelog/recent": TEACHER_UP, // changelog:read
  "GET /api/changelog/stats": TEACHER_UP, // changelog:read

  // clinical-cases
  "DELETE /api/cases/:caseId": TEACHER_UP, // clinical-cases:manage
  "DELETE /api/clinical-cases/:caseId": TEACHER_UP, // clinical-cases:manage
  "GET /api/cases": STUDENT_UP, // clinical-cases:read
  "GET /api/cases/:caseId": STUDENT_UP, // clinical-cases:read
  "GET /api/cases/:caseId/attempts": STUDENT_UP, // clinical-cases:read
  "GET /api/cases/:caseId/definition": TEACHER_UP, // clinical-cases:manage
  "GET /api/clinical-cases": STUDENT_UP, // clinical-cases:read
  "GET /api/clinical-cases/:caseId": STUDENT_UP, // clinical-cases:read
  "GET /api/clinical-cases/:caseId/attempts": STUDENT_UP, // clinical-cases:read
  "GET /api/clinical-cases/:caseId/definition": TEACHER_UP, // clinical-cases:manage
  "PATCH /api/cases/:caseId/expert-validation": TEACHER_UP, // clinical-cases:validate
  "PATCH /api/cases/:caseId/status": TEACHER_UP, // clinical-cases:manage
  "PATCH /api/clinical-cases/:caseId/expert-validation": TEACHER_UP, // clinical-cases:validate
  "PATCH /api/clinical-cases/:caseId/status": TEACHER_UP, // clinical-cases:manage
  "POST /api/cases": TEACHER_UP, // clinical-cases:manage
  "POST /api/cases/:caseId/duplicate": TEACHER_UP, // clinical-cases:manage
  "POST /api/cases/:caseId/evaluate": STUDENT_UP, // clinical-cases:evaluate
  "POST /api/clinical-cases": TEACHER_UP, // clinical-cases:manage
  "POST /api/clinical-cases/:caseId/duplicate": TEACHER_UP, // clinical-cases:manage
  "POST /api/clinical-cases/:caseId/evaluate": STUDENT_UP, // clinical-cases:evaluate
  "PUT /api/cases/:caseId": TEACHER_UP, // clinical-cases:manage
  "PUT /api/clinical-cases/:caseId": TEACHER_UP, // clinical-cases:manage

  // curriculum
  "GET /api/curriculum/beginner": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/curriculum/level/:level": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/curriculum/modules/:moduleId/next": STUDENT_UP, // progress:read_own
  "GET /api/curriculum/modules/:moduleId/unlocked": STUDENT_UP, // progress:read_own
  "GET /api/curriculum/overview": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/curriculum/prerequisitos": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/curriculum/tree": PUBLIC, // OptionalJwtAuthGuard

  // curriculum-editor
  "DELETE /api/teaching/node/:id": TEACHER_UP, // curriculum:manage
  "GET /api/teaching/lesson/:id/content": TEACHER_UP, // curriculum:manage
  "GET /api/teaching/tree": TEACHER_UP, // curriculum:manage
  "POST /api/teaching/node": TEACHER_UP, // curriculum:manage
  "PUT /api/teaching/lesson/:id/content": TEACHER_UP, // curriculum:manage
  "PUT /api/teaching/node/:id": TEACHER_UP, // curriculum:manage

  // evaluation
  "DELETE /api/evaluations/:id": TEACHER_UP, // evaluations:manage
  "DELETE /api/evaluations/:id/assignments/:assignmentId": TEACHER_UP, // evaluations:assign
  "DELETE /api/evaluations/:id/questions/:questionId": TEACHER_UP, // evaluations:manage
  "DELETE /api/evaluations/:id/questions/:questionId/options/:optionId": TEACHER_UP, // evaluations:manage
  "DELETE /api/evaluations/:id/scenarios/:scenarioId": TEACHER_UP, // evaluations:manage
  "GET /api/evaluation-assignments": TEACHER_UP, // evaluations:assign
  "GET /api/evaluation-attempts/:attemptId": STUDENT_UP, // evaluations:attempt
  "GET /api/evaluation-attempts/:attemptId/feedback": STUDENT_UP, // evaluations:attempt
  "GET /api/evaluation-grading/attempts/:attemptId": TEACHER_UP, // evaluations:grade
  "GET /api/evaluation-grading/attempts/:attemptId/feedback": TEACHER_UP, // evaluations:grade
  "GET /api/evaluation-grading/queue": TEACHER_UP, // evaluations:grade
  "GET /api/evaluations": TEACHER_UP, // evaluations:read
  "GET /api/evaluations/:id": TEACHER_UP, // evaluations:read
  "GET /api/evaluations/:id/assignments": TEACHER_UP, // evaluations:assign
  "GET /api/my-evaluations": STUDENT_UP, // evaluations:attempt
  "GET /api/my-evaluations/grades": STUDENT_UP, // evaluations:attempt
  "PATCH /api/evaluations/:id": TEACHER_UP, // evaluations:manage
  "PATCH /api/evaluations/:id/assignments/:assignmentId": TEACHER_UP, // evaluations:assign
  "PATCH /api/evaluations/:id/questions/:questionId": TEACHER_UP, // evaluations:manage
  "PATCH /api/evaluations/:id/questions/:questionId/options/:optionId": TEACHER_UP, // evaluations:manage
  "PATCH /api/evaluations/:id/scenarios/:scenarioId": TEACHER_UP, // evaluations:manage
  "PATCH /api/evaluations/:id/status": TEACHER_UP, // evaluations:manage
  "POST /api/evaluation-attempts/:attemptId/submit": STUDENT_UP, // evaluations:attempt
  "POST /api/evaluation-grading/attempts/:attemptId/feedback/regenerate": TEACHER_UP, // evaluations:grade
  "POST /api/evaluation-grading/attempts/:attemptId/publish": TEACHER_UP, // evaluations:grade
  "POST /api/evaluation-grading/publish": TEACHER_UP, // evaluations:grade
  "POST /api/evaluations": TEACHER_UP, // evaluations:manage
  "POST /api/evaluations/:id/assignments": TEACHER_UP, // evaluations:assign
  "POST /api/evaluations/:id/assignments/:assignmentId/close": TEACHER_UP, // evaluations:assign
  "POST /api/evaluations/:id/duplicate": TEACHER_UP, // evaluations:manage
  "POST /api/evaluations/:id/questions": TEACHER_UP, // evaluations:manage
  "POST /api/evaluations/:id/questions/:questionId/options": TEACHER_UP, // evaluations:manage
  "POST /api/evaluations/:id/scenarios": TEACHER_UP, // evaluations:manage
  "POST /api/my-evaluations/:assignmentId/attempts": STUDENT_UP, // evaluations:attempt
  "PUT /api/evaluation-attempts/:attemptId/answers/:questionId": STUDENT_UP, // evaluations:attempt
  "PUT /api/evaluation-grading/attempts/:attemptId/answers/:questionId": TEACHER_UP, // evaluations:grade
  "PUT /api/evaluations/:id/questions/:questionId/options/order": TEACHER_UP, // evaluations:manage
  "PUT /api/evaluations/:id/questions/order": TEACHER_UP, // evaluations:manage
  "PUT /api/evaluations/:id/scenarios/order": TEACHER_UP, // evaluations:manage

  // groups
  "DELETE /api/groups/:id": TEACHER_UP, // groups:delete
  "DELETE /api/groups/:id/members/:userId": TEACHER_UP, // groups:manage_members
  "DELETE /api/groups/:id/supervisions/:studentGroupId": ADMIN_ONLY, // groups:manage_supervisions
  "GET /api/groups": TEACHER_UP, // groups:read
  "GET /api/groups/:id": STUDENT_UP, // groups:read_own
  "GET /api/groups/:id/members": STUDENT_UP, // groups:read_own
  "GET /api/groups/:id/supervisions": ADMIN_ONLY, // groups:manage_supervisions
  "GET /api/groups/mine": STUDENT_UP, // groups:read_own
  "PATCH /api/groups/:id": TEACHER_UP, // groups:update
  "PATCH /api/groups/:id/lead": TEACHER_UP, // groups:update
  "POST /api/groups": TEACHER_UP, // groups:create
  "POST /api/groups/:id/members": TEACHER_UP, // groups:manage_members
  "POST /api/groups/:id/supervisions": ADMIN_ONLY, // groups:manage_supervisions

  // health
  "GET /": PUBLIC, // no guard
  "GET /api/health": PUBLIC, // no guard
  "GET /api/health/ready": PUBLIC, // no guard
  "GET /health": PUBLIC, // no guard
  "GET /health/ready": PUBLIC, // no guard

  // lessons
  "DELETE /api/lessons/:id": ADMIN_ONLY, // lessons:delete
  "GET /api/lessons/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/lessons/:id/next": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/lessons/:id/previous": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/lessons/:id/steps": PUBLIC, // OptionalJwtAuthGuard
  "POST /api/lessons": TEACHER_UP, // lessons:create
  "POST /api/lessons/:id/access": STUDENT_UP, // progress:update_own
  "POST /api/lessons/:id/complete": STUDENT_UP, // progress:update_own
  "PUT /api/lessons/:id": TEACHER_UP, // lessons:update
  "PUT /api/lessons/reorder": TEACHER_UP, // lessons:update

  // levels
  "DELETE /api/levels/:id": ADMIN_ONLY, // levels:delete
  "DELETE /api/levels/:id/prerequisites/:prereqId": TEACHER_UP, // levels:update
  "GET /api/levels": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/levels/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/levels/:id/can-delete": ADMIN_ONLY, // levels:delete
  "GET /api/levels/:id/modules": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/levels/:id/prerequisites": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/levels/:id/unlock-status": STUDENT_UP, // progress:read_own
  "GET /api/levels/curriculum": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/levels/roadmap": STUDENT_UP, // progress:read_own
  "POST /api/levels": TEACHER_UP, // levels:create
  "POST /api/levels/:id/prerequisites": TEACHER_UP, // levels:update
  "PUT /api/levels/:id": TEACHER_UP, // levels:update
  "PUT /api/levels/:id/prerequisites": TEACHER_UP, // levels:update
  "PUT /api/levels/reorder": TEACHER_UP, // levels:update

  // media
  "DELETE /api/media/:id": TEACHER_UP, // media:delete
  "GET /api/media": TEACHER_UP, // media:read
  "GET /api/media/:id": TEACHER_UP, // media:read
  "GET /api/media/:id/url": AUTHENTICATED, // JwtAuthGuard
  "POST /api/media": TEACHER_UP, // media:create

  // modules
  "DELETE /api/modules/:id": ADMIN_ONLY, // modules:delete
  "DELETE /api/modules/:id/prerequisites/:prerequisiteId": TEACHER_UP, // modules:update
  "GET /api/modules": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/modules/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/modules/:id/full": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/modules/:id/lessons": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/modules/:id/lessons/count": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/modules/:id/progress": STUDENT_UP, // progress:read_own
  "GET /api/modules/:id/resume": STUDENT_UP, // progress:read_own
  "POST /api/modules": TEACHER_UP, // modules:create
  "POST /api/modules/:id/prerequisites": TEACHER_UP, // modules:update
  "PUT /api/modules/:id": TEACHER_UP, // modules:update
  "PUT /api/modules/:id/prerequisites": TEACHER_UP, // modules:update
  "PUT /api/modules/reorder": TEACHER_UP, // modules:update

  // notes
  "DELETE /api/notes/:noteId": STUDENT_UP, // notes:delete_own
  "GET /api/notes": STUDENT_UP, // notes:read_own
  "GET /api/notes/:noteId": STUDENT_UP, // notes:read_own
  "GET /api/notes/lessons/:lessonId": STUDENT_UP, // notes:read_own
  "GET /api/notes/modules/:moduleId": STUDENT_UP, // notes:read_own
  "PATCH /api/notes/:noteId": STUDENT_UP, // notes:update_own
  "POST /api/notes": STUDENT_UP, // notes:create_own
  "POST /api/notes/analyze": STUDENT_UP, // notes:read_own

  // notifications
  "DELETE /api/notifications/:id": AUTHENTICATED, // JwtAuthGuard
  "GET /api/notifications": AUTHENTICATED, // JwtAuthGuard
  "GET /api/notifications/unread-count": AUTHENTICATED, // JwtAuthGuard
  "PATCH /api/notifications/:id/read": AUTHENTICATED, // JwtAuthGuard
  "PATCH /api/notifications/read-all": AUTHENTICATED, // JwtAuthGuard

  // overrides
  "DELETE /api/overrides/:id": TEACHER_UP, // overrides:delete
  "GET /api/overrides": TEACHER_UP, // overrides:read
  "GET /api/overrides/:id": TEACHER_UP, // overrides:read
  "POST /api/overrides": TEACHER_UP, // overrides:create
  "PUT /api/overrides/:id": TEACHER_UP, // overrides:update

  // pages
  "DELETE /api/pages/:id": ADMIN_ONLY, // pages:delete
  "DELETE /api/pages/:id/blocks/:blockId": TEACHER_UP, // pages:update
  "GET /api/pages": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/pages/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/pages/by-legacy-json/:legacyJsonId": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/pages/by-lesson/:lessonId": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/pages/by-module/:moduleId": PUBLIC, // OptionalJwtAuthGuard
  "POST /api/pages": TEACHER_UP, // pages:create
  "POST /api/pages/:id/blocks": TEACHER_UP, // pages:update
  "PUT /api/pages/:id": TEACHER_UP, // pages:update
  "PUT /api/pages/:id/blocks/:blockId": TEACHER_UP, // pages:update
  "PUT /api/pages/:id/blocks/reorder": TEACHER_UP, // pages:update
  "PUT /api/pages/reorder": TEACHER_UP, // pages:update

  // platform-settings
  "GET /api/platform-settings": ADMIN_ONLY, // settings:manage
  "PATCH /api/platform-settings/:key": ADMIN_ONLY, // settings:manage
  "POST /api/platform-settings/:key/reset": ADMIN_ONLY, // settings:manage

  // progress
  "GET /api/progress/achievements": STUDENT_UP, // progress:read_own
  "GET /api/progress/lesson/:lessonId": STUDENT_UP, // progress:read_own
  "GET /api/progress/lesson/:lessonId/details": STUDENT_UP, // progress:read_own
  "GET /api/progress/levels/:levelId": STUDENT_UP, // progress:read_own
  "GET /api/progress/milestones": STUDENT_UP, // progress:read_own
  "GET /api/progress/module/:moduleId": STUDENT_UP, // progress:read_own
  "GET /api/progress/modules/:moduleId": STUDENT_UP, // progress:read_own
  "GET /api/progress/overview": STUDENT_UP, // progress:read_own
  "GET /api/progress/resume/:moduleId": STUDENT_UP, // progress:read_own
  "GET /api/progress/sections/:sectionId": STUDENT_UP, // progress:read_own
  "GET /api/progress/skills": STUDENT_UP, // progress:read_own
  "GET /api/progress/summary": STUDENT_UP, // progress:read_own
  "GET /api/progress/users/:userId/levels/:levelId": TEACHER_UP, // progress:read
  "GET /api/progress/users/:userId/modules/:moduleId": TEACHER_UP, // progress:read
  "GET /api/progress/users/:userId/sections/:sectionId": TEACHER_UP, // progress:read
  "GET /api/progress/users/:userId/summary": TEACHER_UP, // progress:read
  "GET /api/teaching/lessons/:lessonId/access": STUDENT_UP, // progress:read_own
  "GET /api/teaching/modules/:moduleId/access": STUDENT_UP, // progress:read_own
  "GET /api/teaching/modules/unlocked": STUDENT_UP, // progress:read_own
  "POST /api/progress/pages/:pageId/view": STUDENT_UP, // progress:update_own
  "POST /api/progress/step/update": STUDENT_UP, // progress:update_own
  "PUT /api/progress/lesson/:lessonId": STUDENT_UP, // progress:update_own

  // quizzes
  "GET /api/evaluation/quizzes": STUDENT_UP, // quizzes:read
  "GET /api/evaluation/quizzes/:quizId": STUDENT_UP, // quizzes:read
  "GET /api/evaluation/quizzes/:quizId/my-attempt": STUDENT_UP, // quizzes:read
  "GET /api/evaluation/quizzes/my-attempts": STUDENT_UP, // quizzes:read
  "GET /api/quizzes": STUDENT_UP, // quizzes:read
  "GET /api/quizzes/:quizId": STUDENT_UP, // quizzes:read
  "GET /api/quizzes/:quizId/my-attempt": STUDENT_UP, // quizzes:read
  "GET /api/quizzes/my-attempts": STUDENT_UP, // quizzes:read
  "POST /api/evaluation/quizzes/:quizId/attempt": STUDENT_UP, // quizzes:attempt
  "POST /api/quizzes/:quizId/attempt": STUDENT_UP, // quizzes:attempt

  // reservations
  "GET /api/reservations": STUDENT_UP, // reservations:read
  "GET /api/reservations/current": STUDENT_UP, // reservations:read
  "GET /api/reservations/mine": STUDENT_UP, // reservations:read
  "POST /api/reservations": STUDENT_UP, // reservations:create
  "POST /api/reservations/:id/cancel": STUDENT_UP, // reservations:create
  "POST /api/reservations/:id/preempt": TEACHER_UP, // reservations:manage

  // scores
  "DELETE /api/scores/:id": TEACHER_UP, // scores:delete
  "GET /api/scores/my-scores": TEACHER_UP, // scores:read
  "GET /api/scores/students/:studentId": TEACHER_UP, // scores:read
  "POST /api/scores": TEACHER_UP, // scores:create

  // sections
  "DELETE /api/sections/:id": ADMIN_ONLY, // sections:delete
  "GET /api/sections": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/sections/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/sections/:id/levels": PUBLIC, // OptionalJwtAuthGuard
  "PATCH /api/sections/:id/status": TEACHER_UP, // sections:update
  "POST /api/sections": TEACHER_UP, // sections:create
  "PUT /api/sections/:id": TEACHER_UP, // sections:update
  "PUT /api/sections/reorder": TEACHER_UP, // sections:update

  // simulation
  "DELETE /api/simulation/reserve": STUDENT_UP, // simulation:control
  "GET /api/simulation/health": PUBLIC, // no guard
  "GET /api/simulation/patient": STUDENT_UP, // simulation:read
  "GET /api/simulation/sessions": STUDENT_UP, // simulation:read
  "GET /api/simulation/sessions/:id/replay": STUDENT_UP, // simulation:read
  "GET /api/simulation/sessions/:id/state": STUDENT_UP, // simulation:read
  "GET /api/simulation/sessions/:id/summary": STUDENT_UP, // simulation:read
  "GET /api/simulation/sessions/history": STUDENT_UP, // simulation:read
  "GET /api/simulation/status": STUDENT_UP, // simulation:read
  "POST /api/clinical-cases/:caseId/test-run": TEACHER_UP, // clinical-cases:manage
  "POST /api/simulation/command": STUDENT_UP, // simulation:control
  "POST /api/simulation/patient/configure": STUDENT_UP, // simulation:control
  "POST /api/simulation/patient/start": STUDENT_UP, // simulation:control
  "POST /api/simulation/patient/stop": STUDENT_UP, // simulation:control
  "POST /api/simulation/reserve": STUDENT_UP, // simulation:control
  "POST /api/simulation/session": STUDENT_UP, // simulation:control
  "POST /api/simulation/session/save": STUDENT_UP, // simulation:control
  "POST /api/simulation/sessions": STUDENT_UP, // simulation:control
  "POST /api/simulation/sessions/:id/assist": STUDENT_UP, // simulation:control
  "POST /api/simulation/sessions/:id/end": STUDENT_UP, // simulation:control
  "POST /api/simulation/sessions/:id/events": STUDENT_UP, // simulation:control

  // steps
  "DELETE /api/cards/:id": ADMIN_ONLY, // steps:delete
  "DELETE /api/steps/:id": ADMIN_ONLY, // steps:delete
  "GET /api/cards": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/cards/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/cards/:id/next": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/cards/:id/previous": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/steps": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/steps/:id": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/steps/:id/next": PUBLIC, // OptionalJwtAuthGuard
  "GET /api/steps/:id/previous": PUBLIC, // OptionalJwtAuthGuard
  "POST /api/cards": TEACHER_UP, // steps:create
  "POST /api/steps": TEACHER_UP, // steps:create
  "PUT /api/cards/:id": TEACHER_UP, // steps:update
  "PUT /api/cards/reorder": TEACHER_UP, // steps:update
  "PUT /api/steps/:id": TEACHER_UP, // steps:update
  "PUT /api/steps/reorder": TEACHER_UP, // steps:update

  // system-status
  "GET /api/system/status": TEACHER_UP, // system:status
  "POST /api/system/probe/ai/:provider": ADMIN_ONLY, // system:probe

  // teacher-students
  "DELETE /api/teacher-students/:id": ADMIN_ONLY, // teacher-students:manage
  "DELETE /api/teachers/:teacherId/students/:studentId": ADMIN_ONLY, // teacher-students:manage
  "GET /api/students/:id/teachers": ADMIN_ONLY, // teacher-students:manage
  "GET /api/teacher-students": ADMIN_ONLY, // teacher-students:manage
  "GET /api/teachers/:id/students": ADMIN_ONLY, // teacher-students:read + self(id) or teacher-students:manage
  "GET /api/teachers/:teacherId/students/:studentId/progress": ADMIN_ONLY, // teacher-students:read + self(teacherId) or teacher-students:manage
  "GET /api/teachers/me/students/:studentId/check": TEACHER_UP, // teacher-students:read
  "POST /api/teacher-students": ADMIN_ONLY, // teacher-students:manage

  // users
  "GET /api/users": TEACHER_UP, // users:list
  "GET /api/users/me": AUTHENTICATED, // JwtAuthGuard
  "GET /api/users/me/stats": AUTHENTICATED, // JwtAuthGuard
  "GET /api/users/students": ADMIN_ONLY, // students:read_all
  "GET /api/users/students/:id": TEACHER_UP, // students:read
  "PATCH /api/users/:id/role": ADMIN_ONLY, // users:update_role
  "PATCH /api/users/:id/status": ADMIN_ONLY, // users:update_status
  "PATCH /api/users/me": AUTHENTICATED, // JwtAuthGuard
  "POST /api/users/me/change-password": AUTHENTICATED, // JwtAuthGuard

  // ventilator-commands
  "DELETE /api/ventilator/control": STUDENT_UP, // ventilator:control
  "GET /api/ventilator/commands": STUDENT_UP, // ventilator:control
  "GET /api/ventilator/control": STUDENT_UP, // ventilator:control
  "POST /api/ventilator/commands": STUDENT_UP, // ventilator:control
  "POST /api/ventilator/control": RESERVATION_HOLDER_ONLY, // ventilator:control; 403 without an active reservation held by the caller
  "POST /api/ventilator/control/heartbeat": STUDENT_UP, // ventilator:control
  "POST /api/ventilator/control/takeover": RESERVATION_HOLDER_ONLY, // ventilator:control; 403 without an active reservation held by the caller

  // ventilator-telemetry
  "GET /api/ventilator/telemetry/metrics": ADMIN_ONLY, // ventilator:metrics
  "GET /api/ventilator/telemetry/metrics.csv": ADMIN_ONLY, // ventilator:metrics
  "GET /api/ventilator/telemetry/recordings/:reservationId": STUDENT_UP, // simulation:read
  "POST /api/ventilator/telemetry/metrics/reset": ADMIN_ONLY, // ventilator:metrics
  "POST /api/ventilator/telemetry/recordings/start": STUDENT_UP, // simulation:read
  "POST /api/ventilator/telemetry/recordings/stop": STUDENT_UP, // simulation:read
};
