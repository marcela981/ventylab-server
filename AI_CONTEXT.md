# VentyLab Server — Contexto para IA

## Descripción del proyecto
Backend Express + TypeScript del Sistema Ciberfísico Educativo VentyLab (enseñanza de ventilación mecánica).
Tesis de Marcela Mazo Castro — Universidad del Valle.

Este documento refleja el árbol **post-limpieza** (rama `cleanup-pre-entrega`, julio 2026).
Repo hermano: `../ventilab-web` (frontend Next.js, tiene su propio AI_CONTEXT.md).

**Stack:**
- Express 4 + TypeScript 5 (build `tsc` → `dist/`; dev con `tsx watch`)
- Prisma 6 + PostgreSQL (pooled + `DIRECT_URL`, estilo Neon/Supabase)
- Auth: JWT propio (jsonwebtoken) + puente NextAuth; bcryptjs; RBAC por middleware
- Realtime: Socket.io 4 (`WSGateway`) — IoT: MQTT 5 (Node-RED/ESP), InfluxDB v2 (telemetría)
- IA: @google/generative-ai — Gemini 2.0 Flash vía `shared/ai/AIServiceManager`
- Validación: express-validator (NO zod); seguridad: helmet, CORS whitelist, express-rate-limit
- En deps también: next-auth v5 beta y @supabase/* (revisar si legado)

**Scripts npm:** `dev` (tsx watch), `build` (tsc), `start`, `prisma:*` (generate/migrate/deploy/reset/studio/seed), `seed:evaluation`, `seed:clinical`, `test` (jest — **no funciona hasta restaurar los tests diferidos**), `simulate:vent` (telemetría MQTT sintética).

---

## Entrypoint (`src/index.ts`)

Express + `http.createServer` + Socket.io. El router de `simulation` se monta dentro de `startServer` (después de inicializar Socket.io). Global: `trust proxy`, CORS whitelist, helmet (CORP/COOP relajados), compression, rate-limit en `/api` (500 req/15 min, salta `/health`), morgan, middleware que reescribe `/api/api/*` → `/api/*`, y `notFoundHandler` + `errorHandler` al final.

Envelope de respuesta: `{ success, data }` (+ `message` en errores) — helpers en `shared/utils/response.ts`. El frontend depende de esta convención.

---

## Módulos (`src/modules/`) y endpoints reales

| Base path | Módulo / archivo | Propósito |
|---|---|---|
| `/health`, `/api/health` | health/ | Liveness |
| `/api/auth` (y `/auth`) | auth/ | Registro, login, JWT, puente NextAuth |
| `/api/users` | profile/ | Perfil propio, stats, cambio de password |
| `/api/progress` (y `/progress`) | teaching/progress.routes | Progreso de aprendizaje |
| `/api/modules`, `/api/lessons`, `/api/levels`, `/api/cards`, `/api/curriculum`, `/api/teaching`, `/api/pages`, `/api/changelog`, `/api/overrides`, `/api` (teacher-students) | teaching/ | Plataforma de contenido: niveles→módulos→lecciones→steps, páginas CMS, auditoría, overrides, relación teacher-student |
| `/api/cases` | evaluation/evaluation.controller | Casos clínicos (evaluar, intentos) |
| `/api/evaluation` | evaluation/quiz.router | Quizzes y actividades públicas |
| `/api/admin` (y `/admin`), `/api/groups`, `/api/scores` | admin/ | Gestión de estudiantes, grupos, notas, estadísticas |
| `/api/activities`, `/api/activity-assignments`, `/api/activity-submissions` | activities/ | Actividades: CRUD, asignación, entregas, calificación |
| `/api/simulation` | simulation/ | Simulador: comandos, reservas, sesiones, paciente |

`/api/ai` está **comentado (TODO)** en index.ts — el subsistema IA existe pero no expone rutas.

### Endpoints por módulo (auth middleware indicado)

**auth** — `POST /register`, `POST /login`, `POST /logout`, `GET /me`, `POST /nextauth-token`

**profile (`/api/users`)** — `GET|PUT|PATCH /me`, `POST /me/change-password`, `GET /me/stats`; `GET /students` (admin), `GET /students/:id` (teacher+)

**progress** — `GET /overview`, `GET /module/:moduleId`, `GET|PUT /lesson/:lessonId`, `POST /lesson/:lessonId/complete`, `POST /lesson/:lessonId/complete-unified`, `GET /lesson/:lessonId/details`, `POST /step/update`, `GET /resume/:moduleId`, `GET /milestones|/achievements|/skills`, `GET /debug/write-test`

**cases (`/api/cases`)** — `GET /`, `GET /:caseId`, `POST /:caseId/evaluate`, `GET /:caseId/attempts`

**evaluation (`/api/evaluation`, con read/writeLimiter)** — `GET /quizzes`, `GET /quizzes/my-attempts`, `GET /quizzes/:quizId`, `GET /quizzes/:quizId/my-attempt`, `POST /quizzes/:quizId/attempt`, `GET /activities`, `GET /activities/:id`

**modules** — `GET /`, `GET /:id`, `GET /:id/lessons`, `GET /:id/lessons/count`; `GET /:id/progress|/resume` (auth); `POST /` y `PUT /:id` (teacher+), `DELETE /:id` (admin); prerequisites `POST|DELETE` (teacher+)

**lessons** — `GET /:id`, `GET /:id/next|/previous|/steps`; `POST /:id/complete|/access` (auth); `POST /`, `PUT /:id` (teacher+), `DELETE /:id` (admin)

**levels** — `GET /`, `GET /curriculum` (optionalAuth), `GET /roadmap` (auth), `GET /:id`, `GET /:id/modules|/prerequisites`, `GET /:id/unlock-status` (auth); `PUT /reorder`, `POST /`, `PUT /:id`, prerequisites (teacher+); `DELETE /:id`, `/can-delete` (admin)

**cards (steps)** — `GET /`, `GET /:id`, `GET /:id/next|/previous`; `PUT /reorder`, `POST /`, `PUT /:id` (teacher+); `DELETE /:id` (admin)

**curriculum** — `GET /overview|/beginner|/prerequisitos|/level/:level` (optionalAuth); `GET /modules/:moduleId/unlocked|/next` (auth)

**teacher-students (en `/api`)** — CRUD de relaciones teacher↔student (admin/teacher+), `GET /teachers/:teacherId/students/:studentId/progress` (teacher+)

**changelog / overrides** — todo con auth + teacher+

**teaching (`/api/teaching`, auth a nivel router)** — `POST /lessons/:lessonId/complete`, `GET /modules/unlocked`, `GET /modules/:moduleId/access`, `GET /lessons/:lessonId/access`; CMS: `GET /tree`, `POST /node`, `PUT|DELETE /node/:id`, `GET|PUT /lesson/:id/content` (teacher+)

**pages (`/api/pages`, GET públicos)** — `GET /by-legacy-json/:legacyJsonId`, `GET /by-lesson/:lessonId`, `GET /by-module/:moduleId`, `GET /:id`

**admin** — `GET /students`, `GET /students/:id/progress`, `GET /statistics` (teacher+); `GET /teachers`, `PATCH /users/:id/role` (admin)

**groups** — `GET|POST /`, `GET|PATCH|DELETE /:id`, `GET|POST /:id/members`, `DELETE /:id/members/:userId`, `PATCH /:id/lead`

**scores** — `POST /`, `DELETE /:id`, `GET /students/:studentId`, `GET /my-scores`

**activities** — `GET /`, `GET /:id`; `POST /`, `PUT|DELETE /:id`, `POST /:id/publish`, `GET /:id/submissions` (teacher+)

**activity-assignments** — `GET /`, `POST /`, `DELETE /:id`

**activity-submissions** — `GET /my`, `GET /for-activity/:activityId`, `GET /:id`, `POST /`, `PUT /:id`, `POST /:id/submit`; `PUT /:id/grade`, `DELETE /:id/reset` (teacher+)

**simulation** — `GET /health|/status`, `POST /command`, `POST|DELETE /reserve`, `POST /session`, `POST /session/save`, `GET /sessions`, `POST /patient/configure|/start|/stop`, `GET /patient`

---

## Capa compartida (`src/shared/`)

- `ai/AIServiceManager.ts` — orquestador multi-proveedor: cadena de fallback `['gemini','openai','claude']`, rate limiting por proveedor. **Solo Gemini está instanciado** (`ai/providers/GeminiProvider.ts`, gemini-2.0-flash); imports de OpenAI/Claude comentados. Lo consume `evaluation.service`.
- `infrastructure/database.ts` — singleton de Prisma Client (`DATABASE_URL`).
- `middleware/` — `auth.middleware` (authenticate, optionalAuth, requireRole, requireAdmin, requireTeacherPlus), `error-handler`, `rate-limiter` (read/writeLimiter), `validator` + `validators` (express-validator).
- `types/` — augmentación de Request, tipos comunes, overrides, progress.
- `utils/` — computeModuleProgress, errors, jwt, password (bcrypt), response (envelope).

---

## Datos (`prisma/schema.prisma` — PostgreSQL, 33 modelos)

User, Account, Session, VerificationToken, ChangeLog, TeacherStudent, ContentOverride, Level, LevelPrerequisite, Module, ModulePrerequisite, Lesson, Step, Page, PageSection, PageRevision, PageProgress, Quiz, QuizAttempt, Achievement, ClinicalCase, ExpertConfiguration, VentilatorReservation, SimulatorSession, EvaluationAttempt, UserProgress, LessonCompletion, Activity, ActivityAssignment, ActivitySubmission, Group, GroupMember, Score.

---

## Realtime / IoT (`src/modules/simulation/`)

- `ws-gateway.ts` — gateway Socket.io con sockets autenticados por JWT; `broadcastData` + `sendToUser`.
- `mqtt-client.ts` — cliente MQTT hacia Node-RED/ESP: suscribe telemetría, publica comandos, reconexión con backoff.
- `influx-service.ts` — escritor batched de series de tiempo (presión/flujo/volumen) en InfluxDB v2; init opcional `fromEnv()`.
- `hex-parser.ts` / `hex-encoder.ts` — protocolo binario del ventilador.
- `patient/` — fisiología del paciente simulado: patient-calculator, signal-generator, clinical-cases.

Contratos del dominio (`ISimulationGateway`, `IVentilatorConnection`, `MQTT_TOPICS`…) vienen de `contracts/simulation.contracts.ts` (raíz).

---

## Contratos

- `contracts/` raíz (8 archivos): **vivos e importados por src/: `admin.contracts.ts` y `simulation.contracts.ts`**. Los otros 6 (ai-feedback, api-responses, evaluation, profile, teaching, websocket-events) no tienen importadores — se dejaron a propósito en la limpieza, pendientes de decisión.
- `src/contracts/`: vacío tras la limpieza (se eliminó `patient.contracts.ts`, sin referencias; el frontend usa su propia copia).
- `tsconfig.json` incluye `src/**/*` y `contracts/**/*`.

---

## Tests diferidos

`__deferred_tests__/` contiene los 9 tests unitarios de simulación + `jest.config.js`, movidos desde `src/modules/simulation/__tests__/` en la curaduría pre-entrega (fuera del árbol de build; reversible — ver `__deferred_tests__/README.md`).

---

## Problemas conocidos

- `/api/ai` no está montado (TODO comentado en index.ts) aunque el subsistema IA está vivo.
- Montajes duplicados por compatibilidad: `/api/auth` y `/auth`; `/api/progress` y `/progress`; `/api/admin` y `/admin`.
- Rutas de `groups`, `scores` y `progress` sin middleware de auth visible por línea — verificar antes de exponer públicamente.
- `next-auth` v5 beta y `@supabase/*` en dependencias de un server Express puro — posible legado.
- `tsc --noEmit`: **0 errores** (baseline verde post-limpieza).
- Scripts de auditoría de tesis (OE1–OE3) viven en `scripts/` (`audit-thesis-objectives.ts`, `auditors/`, `audit-e2e/`); sus reportes generados están en `audit-output/`.

## Nota de limpieza (julio 2026)
Rama `cleanup-pre-entrega`: limpieza en `3c2958f` (51 archivos, −6.578 líneas). Se eliminaron stubs TODO huérfanos, el módulo `ai-feedback` nunca montado, providers stub de IA, scripts one-off y notas; dumps de Neon movidos a `../_backups-neon/`; tests movidos a `__deferred_tests__/`. Dudosos (6 contracts raíz sin importar, auth.service placeholder, scoring.service vacío, audit-output) se dejaron intactos a propósito.
