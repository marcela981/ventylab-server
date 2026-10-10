# Feature: ventilator-features (reservations, ventilator-telemetry, ventilator-commands)

## Objective
Extract the real-ventilator concerns out of `src/features/simulation` into three NestJS hexagonal
features — `reservations`, `ventilator-telemetry`, `ventilator-commands` — implementing scheduled
reservations with teacher preemption and role-based DTOs, a low-latency batched MQTT->socket
telemetry pipeline with metrics and optional recording, and an exclusive-operator command pipeline
with a tracked lifecycle, traced to the UPPAAL models.

## Problem / why
- Reservations are "now + duration" only, no scheduling, limits, preemption or role DTOs.
- Any `simulation:control` holder (STUDENT included) can command the physical ventilator when no
  reservation is active; command DTO is an unchecked `Record<string, unknown>` cast (NaN bypass).
- Telemetry is broadcast to unauthenticated sockets when no reservation is active; no batching,
  no volatile, no metrics, no device staleness, MQTT reconnect gives up after 5 attempts and
  defaults to test.mosquitto.org; command topic hard-coded; no correlationId / lifecycle / persistence.

## Baseline
- Branch `main`, baseline commit `15d7095` (pre-existing simulation work committed as-is).
- `npx tsc --noEmit` green at baseline.
- RDD: on (global). Review consent is relayed only if the native flow requires it.

## Conventions (override the prompt's Express layout — continuity rule)
The prompt asks for `<name>.routes.ts|controller|service|repository|schemas|types|index.ts`.
The repo is NestJS 11 hexagonal; the continuity rule wins:
`src/features/<f>/{application,domain,infrastructure,presentation}` + `<f>.module.ts`.
Public API = `<Feature>Facade` exported by the module (no `index.ts`). Tokens are `unique symbol`.
Rules from `ventylab-server/CLAUDE.md` + `.claude/skills/*` apply (explicit types, no `!`,
`process.env` only in `common/infrastructure/config`, Logger, braces, no comments except the
mandatory author header and `@throws`, UUID v7 ids generated in domain, snake_case maps,
`Timestamptz(6)`, named indexes, errors with i18n keys + `errors-map.ts`, en/es i18n).

Allowed dependencies:
- reservations -> common, users (facade), groups (facade)
- ventilator-telemetry -> common, reservations (facade)
- ventilator-commands -> common, reservations, ventilator-telemetry (facades)
- simulation (legacy adapters) -> reservations, ventilator-telemetry, ventilator-commands (facades).
  None of the three new features may import from `simulation` (no cycles).
- Shared ventilator parameter limits move to `src/common/domain/ventilator/` (single source of truth),
  re-exported by `simulation/domain/engine/ventilator-limits.ts` to avoid churn.

## Design decisions (made without the author; doubts listed in docs/ventilator/OPEN-QUESTIONS.md)
1. Data model: NEW table `reservations` (model `Reservation`) + enums `ReservationHolderType`,
   `ReservationLifecycleStatus` (SCHEDULED|CANCELLED|PREEMPTED|COMPLETED). Legacy
   `ventilator_reservations` is kept read-only (not dropped). Data migration SQL copies rows:
   holderType = GROUP if group_id else USER; createdById = user_id; startsAt = start_time;
   ACTIVE -> SCHEDULED (endsAt = end_time); EXPIRED/COMPLETED -> COMPLETED and
   CANCELLED -> CANCELLED (endsAt = COALESCE(released_at, end_time)); legacy `leader_id` is not
   mapped (operator is now the exclusive-control concept). Old cuid ids are preserved.
2. "Active now" = status SCHEDULED and startsAt <= now < endsAt. No cron. Early release sets
   COMPLETED and endsAt = now.
3. Migration is written OFFLINE (`prisma migrate diff` / hand-written SQL, folder
   `prisma/migrations/20261010120000_ventilator_features/`), NOT applied, NOT `migrate dev`
   (would touch the shared Supabase DB with several pending migrations). `*.sql` is gitignored:
   commit with `git add -f`.
4. Legacy endpoints `POST|DELETE api/simulation/reserve` and `POST api/simulation/command`
   (real-device path) become thin adapters delegating to the new facades (strangler fig),
   keeping their request/response shapes and the `ventilator:reserved|released` events.
5. Telemetry keeps the legacy `ventilator:data` event (VentilatorReading shape) emitted once per
   flush with the latest frame, plus the NEW batch event `ventilator:telemetry` (array of
   frames). Both go to room `ventilator`, volatile. Eligible sockets are joined server-side
   (holders of the active reservation + TEACHER/ADMIN) because the frontend cannot change.
   Others get `ventilator:availability` (occupied/free) — new event. New events:
   `ventilator:connected`, `ventilator:disconnected`, `ventilator:control-changed`,
   `ventilator:command-status`, `reservation:preempted`. `ventilator:alarm`,
   `ventilator:reserved`, `ventilator:released` keep name and payload.
6. Latency: flush every 33 ms means queue wait up to 33 ms, which contradicts "recv -> emit
   p95 < 10 ms". Metrics report processing latency (recv -> enqueued and flush serialization)
   separately from total latency incl. batching wait. The p95 < 10 ms target applies to processing.
7. Decoders: JsonDecoder (default) + the EXISTING hex frame parser wrapped as HexDecoder, plus
   `auto` (json, then hex fallback = current behaviour). No hex specification exists in any repo;
   the hex layout is the pre-existing code, not invented. Config `VENTILATOR_TELEMETRY_DECODER`
   default `auto` to preserve behaviour.
8. Commands: JsonEncoder default (flat legacy payload + additive `correlationId`). HexEncoder wraps
   the existing unused `encodeHexCommand`, selectable but documented as unspecified; no round-trip
   test (no spec vectors). Firmware ACK not evidenced: ACK topic configurable and DISABLED by
   default; lifecycle resolves APPLIED via telemetry settings or TIMEOUT. Current firmware JSON has
   no settings, so APPLIED is unreachable with today's firmware (documented).
9. MQTT: single client in ventilator-telemetry (`mqtt.connect` appears exactly once in src),
   guarded on `globalThis` for hot reload, infinite exponential backoff with cap, QoS 0 subscribe
   for telemetry, QoS 1 publish for commands, graceful end on shutdown. Default broker no longer
   test.mosquitto.org: the connection is enabled iff `MQTT_BROKER_URL` (alias `MQTT_URL`) is set;
   there is no `VENTILATOR_ENABLED` flag (changed during T2).
10. Notifications: `ReservationNotifier` port, realtime adapter. Audit: existing `IAuditRecorder`.

## Tasks
- [x] T1 Shared limits + schema + offline migration + reservations feature (preemption, role DTO,
      limits, cancel rules, legacy reserve adapter). Route: delegated (writer trigger: many files).
- [x] T2 ventilator-telemetry (MQTT singleton, decoders, batching, room access, staleness, seq,
      metrics + CSV, recording, legacy relay removal, Influx sink). Route: delegated.
- [x] T3 ventilator-commands (operator control + heartbeat, validation, rate limit, encoders,
      lifecycle, persistence, legacy command adapter). Route: delegated.
- [x] T4 UPPAAL property tests + docs (audit report, traceability, open questions, verification
      evidence) + bounded telemetry buffer (`VENTILATOR_MAX_BUFFERED_FRAMES`, UPPAAL S8).
      Route: delegated (writer trigger: 2 specs + 9 source files + 6 docs + skills).

## Checks per task
`npx tsc --noEmit`; `npx jest <feature>`; `npx madge --circular --extensions ts src`;
`npx prisma validate`; header grep; `prisma.` outside repositories grep; `mqtt.connect` count.
Not runnable here (documented as manual): live-DB concurrency (needs migration applied),
mqttx bench against a broker, physical ventilator tests.

## Progress / evidence
- Engram mirror `odd/ventilator-features/tasks`: PENDING (mem_save returned ambiguous_project for
  the multi-repo cwd; resync when the project is resolved).
- T1 done (delegated writer + parent follow-up: admin dashboard reads `reservations`, group delete
  guard counts `reservations`, Swagger tag). Evidence: prisma validate OK, tsc 0 errors, jest
  reservations/simulation/groups/authorization/admin green, eslint clean, madge 0 cycles, header grep
  empty; concurrency spec: 20 concurrent creates -> 1 created / 19 conflicts (20/20 without the lock).
  Migration `20261010120000_ventilator_features` written offline, NOT applied.
- T2 done (delegated writer). Evidence: tsc 0 errors; jest telemetry+simulation+reservations+common
  285 passed; full jest 1170/1171 (engine-determinism 500 ms wall-clock test flaky under full parallel
  load, passes alone, untouched code); madge (with --ts-config) 0 cycles; `mqtt.connect` exactly 1;
  no test.mosquitto.org in src; perf spec 3600 frames processing p95 < 10 ms.
  Decision change: connection enabled iff MQTT_BROKER_URL is set (no VENTILATOR_ENABLED flag).
- RDD: user granted review for range 6b9d737..1693093, but START stopped with
  `lens_context_budget_exceeded` (21.6k lines incl. baseline). No authority created. Pending:
  review smaller per-feature commit slices (new consent per candidate).
- T3 done (delegated writer). Evidence: tsc 0 errors; jest commands 115 passed; full jest 1290/1291
  (same engine-determinism load flake, passes alone, 3/3 tests); madge 0 cycles; mqtt.connect 1; no
  simulation imports in the 3 features. UPPAAL command properties S2, S3, S6/S7, L1, L2, R1-R3 in
  `uppaal-commands-properties.spec.ts`.
- T4 done (delegated writer, uncommitted). New `uppaal-reservations-properties.spec.ts` (S2 mutual
  exclusion with seeded concurrent waves, BL1 30 vs 120 min deviation, S3 leader deviation, S7/N1,
  R3; 9 tests; S2 fails when `lockDevice` is a no-op) and `uppaal-telemetry-properties.spec.ts`
  (S3, S5, S7, S8, R1-R3; 7 tests). S8: batch buffer capped by `VENTILATOR_MAX_BUFFERED_FRAMES`
  (default 256, env + settings), oldest frames dropped and counted as `bufferDrops` (metrics, DTO,
  pipeline spec). Docs: `docs/ventilator/{README,AUDIT,UPPAAL-TRACEABILITY,MIGRATION,OPEN-QUESTIONS,
  VERIFICATION}.md`; telemetry docs updated. Skills `application-layer` (realtime port additions and
  `realtime.client-*` events) and `error-handling` (`details` -> response `data`), CLAUDE.md
  Realtime bullet. Evidence: tsc 0 errors; eslint 0 on changed .ts; jest 3 features 28 suites /
  243 tests; full jest 1308/1309 (same engine-determinism flake, passes alone, 3/3 tests); madge 0 cycles
  (both forms); prisma validate OK (4 pre-existing warnings); header grep empty; `mqtt.connect` 1.
  Requirement status (AUDIT.md): 43 implemented, 10 partial, 4 not implemented.
  Pending (author): review/commit T4, apply the migration (MIGRATION.md), manual checks
  (VERIFICATION.md), `.env.example` changes (README.md), RDD review per feature commit slice.
