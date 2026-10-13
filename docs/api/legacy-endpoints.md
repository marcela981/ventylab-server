<!--
Funcionalidad: Inventario de endpoints heredados
Descripción: Lista las rutas HTTP heredadas marcadas como deprecadas, su ruta sucesora, las cabeceras que envían y los consumidores actuales en el frontend (ventilab-web, rama master)
Versión: 1.0
Autor: Marcela Mazo Castro
Proyecto: VentyLab
Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
Institución: Universidad del Valle
Contacto: marcela.mazo@correounivalle.edu.co
-->
# Legacy endpoints

Legacy routes keep working with the same status codes and bodies. They are marked with `@DeprecatedAlias` (a whole aliased controller path) or `@DeprecatedRoute` (one handler) from `src/common/presentation/decorators/deprecated-route.decorator.ts`, which:

- adds `Deprecation: @1791763200` (RFC 9745, deprecated since 2026-10-12T00:00:00Z) to every response that passes the guards;
- adds `Link: <successor>; rel="successor-version"` when the successor URL can be built from the request parameters;
- marks the operation `deprecated: true` with `x-successor` in `openapi/openapi.json` (and `@deprecated` in `packages/api-client`).

Responses rejected by a guard (401/403) do not carry the headers, because interceptors run after guards.

## Inventory

Frontend consumers were found by searching `ventilab-web/src` (branch `master`, read-only) for each path; the frontend prefixes `/api` through its HTTP client.

| Legacy route | Successor | Link header | Current frontend consumer |
|---|---|---|---|
| `GET /api/cards` | `GET /api/steps` | yes | no consumer found |
| `POST /api/cards` | `POST /api/steps` | yes | `src/features/admin/services/teachingService.js:96` |
| `GET /api/cards/:id` | `GET /api/steps/:id` | yes | `src/features/ensenanza/shared/services/teachingContentService.js:101` |
| `PUT /api/cards/:id` | `PUT /api/steps/:id` | yes | `src/features/admin/services/teachingService.js:99` (also `teachingContentService.js:111` calls `PATCH /cards/:id`, a method the backend does not register) |
| `DELETE /api/cards/:id` | `DELETE /api/steps/:id` | yes | `src/features/admin/services/teachingService.js:102` |
| `PUT /api/cards/reorder` | `PUT /api/steps/reorder` | yes | `src/features/admin/services/teachingService.js:105` |
| `GET /api/cards/:id/next` | `GET /api/steps/:id/next` | yes | no consumer found |
| `GET /api/cards/:id/previous` | `GET /api/steps/:id/previous` | yes | no consumer found |
| `GET /api/cases` | `GET /api/clinical-cases` | yes | `src/features/evaluation/services/evaluationService.js:76` |
| `POST /api/cases` | `POST /api/clinical-cases` | yes | no consumer found |
| `GET /api/cases/:caseId` | `GET /api/clinical-cases/:caseId` | yes | `src/features/evaluation/services/evaluationService.js:109` |
| `PUT /api/cases/:caseId` | `PUT /api/clinical-cases/:caseId` | yes | no consumer found |
| `DELETE /api/cases/:caseId` | `DELETE /api/clinical-cases/:caseId` | yes | no consumer found |
| `GET /api/cases/:caseId/attempts` | `GET /api/clinical-cases/:caseId/attempts` | yes | `src/features/evaluation/services/evaluationService.js:176` |
| `GET /api/cases/:caseId/definition` | `GET /api/clinical-cases/:caseId/definition` | yes | no consumer found |
| `POST /api/cases/:caseId/duplicate` | `POST /api/clinical-cases/:caseId/duplicate` | yes | no consumer found |
| `POST /api/cases/:caseId/evaluate` | `POST /api/clinical-cases/:caseId/evaluate` | yes | `src/features/evaluation/services/evaluationService.js:144` |
| `PATCH /api/cases/:caseId/expert-validation` | `PATCH /api/clinical-cases/:caseId/expert-validation` | yes | no consumer found |
| `PATCH /api/cases/:caseId/status` | `PATCH /api/clinical-cases/:caseId/status` | yes | no consumer found |
| `GET /api/evaluation/quizzes` | `GET /api/quizzes` | yes | `src/features/evaluation/api/quiz.api.ts:48`, `src/features/evaluation/services/evaluationService.js:207`, `src/features/evaluation/shared/services/evaluationService.ts:77` |
| `GET /api/evaluation/quizzes/my-attempts` | `GET /api/quizzes/my-attempts` | yes | `src/features/evaluation/api/quiz.api.ts:56`, `src/features/evaluation/services/evaluationService.js:256` |
| `GET /api/evaluation/quizzes/:quizId` | `GET /api/quizzes/:quizId` | yes | `src/features/evaluation/services/evaluationService.js:235`, `src/features/evaluation/shared/services/evaluationService.ts:91` |
| `GET /api/evaluation/quizzes/:quizId/my-attempt` | `GET /api/quizzes/:quizId/my-attempt` | yes | `src/features/evaluation/api/quiz.api.ts:62`, `src/features/evaluation/services/evaluationService.js:282` |
| `POST /api/evaluation/quizzes/:quizId/attempt` | `POST /api/quizzes/:quizId/attempt` | yes | `src/features/evaluation/api/quiz.api.ts:77`, `src/features/evaluation/services/evaluationService.js:317`, `src/features/evaluation/shared/services/evaluationService.ts:107` |
| `PATCH /api/admin/users/:id/role` | `PATCH /api/users/:id/role` | yes | no consumer with this method: `src/features/admin/services/adminService.js:86` calls `PUT /admin/users/:id/role` and `src/features/admin/hooks/useUserManagement.js:280` calls `PATCH /admin/users/:id`, neither registered by the backend |
| `GET /api/pages/by-legacy-json/:legacyJsonId` | `GET /api/pages/by-lesson/:lessonId` (accepts the legacy JSON ID) | yes | no consumer found (the frontend already uses `by-lesson`: `src/features/ensenanza/shared/data/helpers/lessonLoader.js:262`) |
| `GET /api/progress/lesson/:lessonId` | `GET /api/progress/lesson/:lessonId/details?moduleId=` | yes | `src/features/ensenanza/shared/hooks/useProgress.ts:76`, `src/features/progress/services/progressService.ts:488` |
| `PUT /api/progress/lesson/:lessonId` | `POST /api/progress/pages/:pageId/view` (lessons complete through page views) | no (the page ID is not in the legacy request) | `src/features/ensenanza/shared/hooks/useProgress.ts:114`, `src/features/progress/services/progressService.ts:339`, `src/features/progress/services/progressService.js:588` |

28 operations in total. The frontend also calls `POST /api/progress/lesson/:lessonId/complete-unified` (`src/features/ensenanza/shared/progreso/api/progress.api.ts:108`), which the backend does not register.

## Adding or retiring a legacy route

- Mark an aliased controller with `@DeprecatedAlias({ alias: "api/old", successor: "api/new" })` next to `@Controller(["api/new", "api/old"])`, or one handler with `@DeprecatedRoute({ successor: "/api/new/:id" })` (`successorParams` renames parameters, `successorMethod` documents a different method).
- Run `npm run openapi:generate` and `npm run openapi:client`, then add the row here.
- Remove a legacy route only after this table lists no consumer for it.
