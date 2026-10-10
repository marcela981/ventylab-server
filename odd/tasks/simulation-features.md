# Simulation features: sim-engine, clinical-cases, simulation

## Objective
Replace the non-deterministic synthetic signal generator with a pure, deterministic, versioned physiological engine (equation of motion), extend clinical cases (physiological ranges, CRUD, test run, seeded cases with sources) and add event-sourced simulation sessions (FREE/EXAM), server-side replay, rubric scoring for evaluation and AI assist, inside the NestJS hexagonal architecture.

## Phase 1 findings (2026-10-08)
- `simulation/domain/services/signal-generator.ts`: flow and volume prescribed independently (volume is not the integral of flow), auto-PEEP is a constant offset, no Pmus, PSV≡PCV and SIMV≡VCV, independent noise per signal, `Ti + 100 ms` can exceed the cycle, SpO2 ignores PEEP; `Math.random`/`Date.now`/`setInterval` 30 Hz.
- Frontend draws backend curves from socket `ventilator:data`; no P-V/F-V loops; its own generators are dead code or dev-only.
- `ClinicalCase` lacks height, sex, mechanics, events, targets, rubric, status; HTTP is read-only (`/api/cases`, `/api/clinical-cases`), gated by `isActive`.
- `simulator_sessions` stores curves JSON; no seed/engineVersion/mode/status.
- `PRACTICAL_SCORE_PROVIDER_TOKEN` exists (clinical comparison adapter); `ai-ratings` SIM_ASSIST resolver returns undefined; `SIM_ASSIST` prompt v1.0.0 and SSE transport exist.
- Not a monorepo; DB is Supabase; Neon dump predates simulation tables; real row counts not taken (no DB access).

## Decisions (accepted by the author, 2026-10-08)
1. Structure: NestJS hexagonal layers, not the `routes/controller/service/index.ts` layout; public API via module-exported facades.
2. Engine location: `src/features/simulation/domain/engine/`, pure TypeScript, no monorepo; frontend consumption is a separate future task.
3. Validation: 422 only for physiological range violations of a clinical case; other validation stays 400.
4. Sessions: new tables `simulation_sessions` and `simulation_events`; `simulator_sessions` stays frozen with its legacy routes.

## Constraints
- No git writes (the author commits); no `npm run`/`npm install`; no DB connection; no `.env*`; no frontend.
- Migrations generated offline (`prisma migrate diff`), reported, never applied by the agent.
- Existing `/api/simulation/*`, `/api/cases`, `/api/clinical-cases` contracts unchanged; new endpoints on new routes.
- No client-computed scores or metrics accepted.
- Seed clinical values only with a documented source; `validatedByExpert = false`.
- Mandatory authorship header on every new or modified `.ts` file.
- After each block: `npx tsc --noEmit` must be 0 errors before continuing.

## Tasks
- [x] S1 sim-engine (pure, deterministic, ENGINE_VERSION) + physics/determinism/performance specs — route: delegated writer (multi-file, new physics)
- [x] S2 Schema + offline migration SQL, reported to the author before applying — route: delegated writer
- [x] S3 clinical-cases: extended model, physiological ranges (422), CRUD/duplicate/archive, delete 409, test-run endpoint, facade, seed with sources — route: delegated writer
- [x] S4 Simulation sessions and batched events (FREE/EXAM, validation, monotonic time, anti-tamper, idempotency) — route: delegated writer
- [x] S5 State, replay, lazy ABANDONED, group-based access — route: delegated writer
- [x] S6 Rubric scoring + PracticalScoreProvider adapter — route: delegated writer (high risk: changes SIMULATION grading)
- [x] S7 Assist SSE + rule fallback + AI_HELP events + ai-ratings SIM_ASSIST resolver + SimulationFacade — route: delegated writer
- [x] S8 Verification checks 1–17 — route: delegated verifier

## Acceptance criteria
Prompt checks 1–17; DB/provider-dependent runtime checks (17 JSON diff, live 403/422 calls) are run by the author.

## Progress
- 2026-10-08: Phase 1 audit delivered; decisions accepted; feature document created. Engram mirror pending (project ambiguous for ventylab-server).

- 2026-10-08: S1 done (delegated writer). 18 files in `simulation/domain/engine/`, ENGINE_VERSION 1.0.0, 1 ms fixed step with exact exponential update in pressure-target phases. Evidence: `npx tsc --noEmit` 0 errors; `npx jest src/features/simulation/domain/engine` 25/25 passed (10-min replay ~111 ms); purity grep 0; header grep empty; `eslint --fix` applied (8 import-order fixes), tests re-run 25/25. Model simplifications listed in the S1 handoff await the author's physiology review. Not committed (author commits).

- 2026-10-08: S2 done (delegated writer). `schema.prisma` +111 additive lines; offline migration `20261009120000_simulation_features` (4 enums, 3 Pathology values, 14 clinical_cases columns, simulation_sessions/simulation_events, isActive→status backfill, BEGIN/COMMIT). Evidence: prisma validate OK, prisma generate OK, tsc 0 errors. Migration NOT applied; awaiting author review.

- 2026-10-08: Author approved the S2 migration SQL, including ON DELETE CASCADE from users to simulation_sessions. It is still to be applied by the author; the agent never applies it. The author must `git add -f` the SQL because `.gitignore` ignores `*.sql`.

- 2026-10-08: S7a done (delegated writer, parallel). `simulation/domain/assist/` (snapshot ≤3000 chars without identifiers, rule-based advisor es/en) + ai-ratings SIM_ASSIST resolver (AI_HELP event → recipientUserId = session owner). Evidence: jest assist+ai-ratings 80/80, eslint 0, header grep empty. Pending for S7b: run `redactPersonalData` on case title/summary and write `{ aiCallId }` in AI_HELP payload.

- 2026-10-08: S6a done (delegated writer, parallel). `simulation/domain/scoring/` (rubric validator, DEFAULT_SIMULATION_RUBRIC, computeSimulationScore with justified breakdown; default auto-PEEP limit 5). Evidence: jest 20/20, eslint 0, header grep empty. assistancePolicy enforced in S7b.

- 2026-10-08: S3 done (delegated writer + parent mapped 5 new errors in `src/common/presentation/errors-map.ts`: physiological range 422, invalid definition 400, in use / has sessions / not simulation-ready 409). CRUD, status, duplicate, expert validation, delete 409, STUDENT sees PUBLISHED only, ClinicalCasesFacade, 47 documented ranges, 4 engine-ready seed cases with sources (validatedByExpert=false). Evidence: tsc 0, jest clinical-cases 54/54, eslint 0, prisma-grep 0. Follow-up (not fixed, contract kept): legacy `POST :caseId/evaluate` does not check publication status.

- 2026-10-08: S4+S5 done (delegated writer). New routes under `/api/simulation/sessions` (POST, `/history` — legacy `GET /sessions` kept, `/:id/events|state|end|summary|replay`) and `POST /api/clinical-cases/:caseId/test-run`; SimulationFacade + SimulationAssistContextService; config SIMULATION_EVENT_TIME_TOLERANCE_MS, SIMULATION_ABANDON_AFTER_MINUTES, SIMULATION_MAX_EVENT_BATCH_SIZE. Evidence: tsc 0, jest simulation+clinical-cases 180/180, eslint 0, prisma-grep 0, header grep empty. Follow-ups routed to S6b: seed rubric penalties dropped, end default time, list lazy transitions. S6b and S7b launched in parallel.

- 2026-10-08: S7b done (delegated writer, parallel). `POST /api/simulation/sessions/:id/assist` SSE (delta/done/error), AiGateway.stream SIM_ASSIST with deterministic fallback, AI_HELP recorded on done with aiCallId + source, EXAM+DISABLED 403, redactPersonalData on case text/question, SIM_ASSIST prompt 1.1.0 (guides, does not dictate values). Evidence: tsc 0, jest simulation+ai 361/361, eslint 0, header grep empty.

- 2026-10-08: S6b done (delegated writer; parent updated 2 expectations in `simulation.facade.spec.ts` that changed by design). PRACTICAL_SCORE_PROVIDER_TOKEN → SimulationReplayPracticalScoreProvider (replay via SimulationFacade; session must be EXAM and bound to the same user/attempt/question; non-ended sessions scored up to lastSimTimeMs). Port gained a `target` argument. Case rubric limit/AI criteria now mapped to SAFETY_VIOLATIONS/AI_ASSIST_USAGE; legacy question rubrics (parameter/expectedValue) fall back to the case default rubric — author to confirm. End without simTimeMs defaults to elapsed time; history settles stale ACTIVE rows. Old ClinicalComparison adapter left unused. Evidence: tsc 0, madge (with --ts-config) no cycles, eslint 0.

- 2026-10-08: S8 done (read-only verifier + parent tsc spot check 0). Checks 1–9 PASS; 10–16 covered by passing specs; 17 static PASS (legacy simulation controllers untouched, clinical-cases response mappers unchanged). Full `npx jest`: 145/145 suites, 1056/1056 tests. eslint 0. madge (`--ts-config tsconfig.json`) no cycles.

## Pending for the author
- Apply migration `20261009120000_simulation_features` (and `git add -f` it: `.gitignore` ignores `*.sql`), then run `npm run seed:clinical`.
- Live checks after migration: 422/403 calls, JSON diff of legacy `/api/simulation/*` and `/api/cases` (17).
- Confirm: event time ahead → 403 (anti-tamper); legacy SIMULATION question rubrics fall back to the case default rubric; rubric auto-PEEP default limit 5; physiology simplifications from S1; seed values with `validatedByExpert=false`.
- Follow-ups: legacy `POST /api/cases/:caseId/evaluate` ignores publication status; unused `ClinicalComparisonPracticalScoreProvider` and legacy session-ownership reader; frontend consumption of the engine (separate task); `.env.example` lacks the 3 new SIMULATION_* keys.
- Commits by the author (no agent git writes).

## Next step
Feature complete pending author actions above.
