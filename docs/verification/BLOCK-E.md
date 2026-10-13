<!--
  Funcionalidad: Evidencia del bloque E de calidad (seguridad)
  Descripción: Endurecimiento HTTP (helmet, CSP, CORS, límites de cuerpo, x-powered-by), limitación de peticiones de todas las rutas anónimas con su prueba de cobertura, auditoría de dependencias con excepciones justificadas, pruebas de redacción de secretos y datos personales en los registros, escaneo de secretos del historial git con gitleaks en Docker, script del simulador sin broker público, defectos corregidos (BUG-12 a BUG-15), hallazgos solo reportados y resultados observados
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Block E verification — security

Observed on 2026-10-13, Windows 11, Node 22.23.2, npm 12.0.2, Docker 29.8.0, branch `main` (uncommitted working tree on top of `cc04870`). No `.env` file was read; no Supabase, production database, real AI provider, real MQTT topic, ventilator or remote infrastructure was used; git was only read (gitleaks mounts the repository read-only).

## How to run

```text
npx jest --config test/jest/jest.e2e.config.js --runInBand test/e2e/security    # hardening, rate limiting, log redaction
npx jest src/common/presentation/filters src/common/infrastructure/logging src/common/infrastructure/http src/common/domain/utils src/common/presentation/utils
npm run security:audit      # npm audit --omit=dev gate with security/audit-exceptions.json
npm run security:secrets    # gitleaks over the whole git history, in Docker
```

## E1 — HTTP hardening

`src/common/infrastructure/http/http-hardening.ts` (`applyHttpHardening`) is now the single HTTP setup used by `src/main.ts` and `test/support/e2e-app.ts`, so the e2e app no longer drifts from production (it had no helmet before).

- `x-powered-by` disabled explicitly (`app.disable`), on top of helmet.
- helmet defaults (CSP `default-src 'self'`, `frame-ancestors 'self'`, HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy: no-referrer`), with CORP `cross-origin` and COEP/COOP off as before (the frontend is on another origin). CSP is now on in every environment; it was off outside production, which only matters for HTML, and the only HTML page is the documentation.
- `/api/docs` (Scalar UI): outside production the page keeps no CSP, exactly as before, so the interactive UI works while developing (e2e: 200, no CSP header, the page references jsDelivr). In production it gets its own CSP that allows the Scalar bundle from `https://cdn.jsdelivr.net` and its inline bootstrap script, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'` (unit test). Helmet's default CSP would have blocked the production docs page (`script-src 'self'`); it is only reachable with an ADMIN token there.
- CORS: unchanged origin rules (`CORS_ORIGIN`, `FRONTEND_URL`, `PRODUCTION_URL`, `VERCEL_URL`; Vercel previews only with `CORS_ALLOW_VERCEL_PREVIEWS=true`). e2e: a foreign origin and a disabled Vercel preview get no `Access-Control-Allow-Origin` (simple request and preflight); the configured origin gets it with credentials.
- Body limits: JSON **10 MB** (kept): the largest legitimate JSON bodies are the profile image sent as a base64 data URL (the frontend caps the file at 2 MB, about 2.7 MB in base64, and the backend DTO has no length limit) and page content without a block-count limit (text fields up to 100 000 characters each); `MEDIA_MAX_IMAGE_BYTES` is also 10 MiB. File uploads are multipart (Multer, `MEDIA_MAX_*_BYTES`, up to 100 MiB for video) and do not go through these parsers. urlencoded **100 KB** (was 10 MB): no route consumes HTML forms. e2e: 10 MB + 1 JSON body → 413, 100 KB + 1 urlencoded body → 413, a small urlencoded body still reaches validation (400).

## E2 — rate limiting

- `test/e2e/security/rate-limiting.e2e-spec.ts` enumerates the anonymous routes from the running app (`collectRoutes` + `classifyAccess`, minimum role `ANONYMOUS`) and checks they are exactly the operations with `x-min-role: ANONYMOUS` in `openapi/openapi.json`; it fails if any of them carries `@SkipThrottle` without an entry in `THROTTLE_EXEMPT_ROUTES` (only the 5 health-probe paths, each with its reason) or if an exemption is stale, if `ThrottlerGuard` stops being an `APP_GUARD`, or if register, login, Google sign-in, refresh or the bridge lack a `@Throttle` below the default global limit (100/min).
- New: `POST /api/auth/register` limited to 10/min per IP (was only the global 100/min). Login and Google 5/min, refresh 20/min, bridge 60/min, unchanged.
- `RouteDescriptor` gained `throttleSkipped` and `throttleLimit` (read from `@SkipThrottle`/`@Throttle` metadata with handler-over-controller precedence).
- OpenAPI: 429 is now documented on every operation not excluded with `@SkipThrottle` (it was only on `@Throttle` routes, although the guard is global), with the corrected example code (BUG-12). `openapi.json` and `packages/api-client/src/schema.d.ts` regenerated.

## E3 — dependency audit

Before: critical 1, high 15, moderate 3. After `npm update` of 11 packages within their semver ranges (lockfile only): **critical 0**, high 8 packages from **6 advisories, all excepted with reachability reasons**, moderate 2. Details, versions and per-advisory justification: `docs/security/npm-audit.md`. `npm run security:audit` exits 0; with an empty exceptions file it exits 1 (observed).

## E4 — log redaction

`test/e2e/security/log-redaction.e2e-spec.ts` installs `CapturingLogger` (`test/support/capturing-logger.ts`, renders every entry with `util.inspect` at unlimited depth, a superset of the development console and the production JSON lines) through the new `logger` option of `createE2eApp`, and checks the logger output, the `error_logs` rows and the `ai_call_logs` rows (plus the prompts sent to the fake providers) after:

- login: success, wrong password, wrong type, invalid email with extra fields; refresh: tampered token, wrong type with the real refresh token in another field — no password, access/refresh token, JWT secret or email;
- password change: wrong current password, weak new password — no current or new password, no token;
- NextAuth bridge: wrong secret, email mismatch, invalid body — no bridge secret, no email;
- AI (tutor deepen SSE): the question contains the student's full name and email, the first fake provider fails with an error message that contains a fake API key and bearer token, the second answers — the prompts contain neither name nor email (`redactPersonalData`), and telemetry rows and logs contain no name, email, key, bearer or access token.

Every error-path test also asserts that something was logged and persisted, so it cannot pass vacuously. RED observed: 3 of 4 failed before the fixes (password, refresh token and emails in the logs; emails in `error_logs`); GREEN after BUG-13 and BUG-15.

## E5 — secret scan

`npm run security:secrets` (gitleaks v8.21.2 pinned by digest, Docker, read-only mount, git mode over the whole history, `.gitleaks.toml` extending the default rules with two project rules and justified allowlists). Final result: **0 findings**; the 12 findings before the allowlist were all fake values (placeholders, test fixtures, a code reference). **Nothing to rotate.** Details without secret values: `docs/security/secret-scan.md`.

## E6 — simulator script

`scripts/simulate-ventilator.ts` (1.1) no longer falls back to the public `test.mosquitto.org` broker: without `MQTT_BROKER_URL` it prints a clear message and exits 1 (observed from an empty directory with `MQTT_BROKER_URL=""`).

## Bugs fixed

- **BUG-12 — throttled requests answered code `unknown_error`.** Repro: 6 `POST /api/auth/login` in a minute → 429 `{ code: "unknown_error", message: "ThrottlerException: Too Many Requests" }`; the OpenAPI example documented that same wrong code. Fix: the filter maps 429 (and 413) `HttpException`s to translated codes `common.too_many_requests` / `common.payload_too_large` (en/es in `src/i18n/*/common.json`); the 429 example now names `common.too_many_requests`. Regression: `http-exception.filter.spec.ts` (RED observed on the previous filter) and the e2e 429 test (code, Spanish message, `Retry-After`, response valid against the spec).
- **BUG-13 — validation failures logged passwords and tokens.** Repro: `POST /api/auth/login` with an invalid email and a password, or `POST /api/users/me/change-password` with a weak new password → the filter logged the raw `I18nValidationException`, whose errors carry the whole request DTO (`target`), the rejected `value`, and i18n constraint messages that embed the value: the password and the current password appeared in the console log (RED observed in e2e and unit). Fix: the filter logs `describeExceptionForLog(...)` (name, message and stack with emails/JWTs masked; for validation errors only property paths and constraint names); query and route parameters are sanitized like the body.
- **BUG-14 — oversized bodies answered 500 and were reported as unexpected errors.** Repro: a JSON body over 10 MB → the body parser's `PayloadTooLargeError` (an `http-errors` object, not an `HttpException`) fell through to the unexpected branch → 500 `internal_server_error`, Sentry event and `error_logs` row (RED observed in the unit test on the previous filter). Fix: client errors of the body parsers (`status` 4xx with `expose: true`) are handled as HTTP exceptions → 413 `common.payload_too_large`. Also, non-domain 413/429 (traffic rejected before any handler) are logged as a warning only, without Sentry or `error_logs`, so a flood cannot turn into one database row and one Sentry event per request.
- **BUG-15 — emails in error logs and request bodies in Sentry events.** Repro: a failed bridge call or login wrote the request email to the console log and to `error_logs.content` (RED observed in e2e). Sentry's HTTP integration attaches incoming request bodies to every event (default `maxRequestBodySize: "medium"` in `@sentry/core` 10.76; read in the source, not observed, since tests use no DSN), so a non-domain error (for example any validation failure, which the filter reports to Sentry) sent the unredacted body, password included, to Sentry. Fix: `sanitizeBody` also masks email addresses (`maskEmailAddresses`, new common util); `registerSentryRedaction()` (called in `main.ts`) adds a global Sentry event processor that redacts secrets and masks emails in the request body, query, URL, headers and cookies (unit tested; no DSN is used in tests).

## Report-only findings

The requested report-only file `docs/security/findings.md` could not be created by the delegated writer (the tool harness refused it as a report file); its content is kept here so it is not lost.

| # | Finding | Evidence | Proposal |
|---|---|---|---|
| F1 | `NEXTAUTH_SECRET` required but never read | only declared in `env.validation.ts:61` | make it optional or remove it (and from `.env.example`) |
| F2 | `AdminApiKeyGuard` unused | no controller uses it; it compares with `!==`; `ADMIN_API_KEY` is still required | delete it and make the key optional, or use `timingSafeEqual` like the bridge guard |
| F3 | `PrismaService` connects once, no retry, no query timeout | `onModuleInit` → single `$connect()`; no `statement_timeout` | `connect_timeout`, `pool_timeout`, `statement_timeout` in `DATABASE_URL`; bounded retry on boot |
| F4 | BUG-11 (open): notes analysis has no AI fallback | 503 when every provider fails (documented contract) | awaiting the author's decision |
| F5 | Throttling trusts one proxy hop | `trust proxy` 1, throttler keyed on `req.ip` | keep the backend reachable only through Traefik |
| F6 | Sign-in limits are per IP | login 5/min, register 10/min | raise or key on IP + email if a campus NAT is throttled |
| F7 | `/health/ready` unthrottled, pings the database | `@SkipThrottle` on `HealthController` | restrict readiness to the internal network at the proxy |
| F8 | Socket.io messages are not rate limited | `ThrottlerGuard` only guards HTTP | per-socket token bucket if abuse is observed |
| F9 | `/api/docs` is Express middleware outside the throttler | `setupDocs` | acceptable (ADMIN-only in production) |
| F10 | `rawBody: true` keeps a raw copy of every body | no code reads `req.rawBody` | remove until a webhook needs it |
| F11 | translations watched in production | `I18nModule` `watch: true` (`app.module.ts:86`) | `watch` only outside production |
| F12 | secrets have no minimum length | `JWT_SECRET` etc. only `@IsString()` | `@MinLength(32)` in production |
| F13 | 413 not documented in the OpenAPI contract | filter answers it since BUG-14 | document 413 on operations with a body |
| F14 | non-domain 4xx (validation, 401/403) reach Sentry | filter captures every non-`DomainError` | skip Sentry for 4xx |
| F15 | MQTT broker URL is logged | `MQTT connected to <url>` | keep credentials out of the URL or log only the host |
| F16 | `CLAUDE.md` Sessions bullet omits registration throttling | outside this block's edit surface | add "registration" |

## Files

New: `src/common/infrastructure/http/http-hardening.ts` (+ spec), `src/common/infrastructure/logging/sentry-redaction.ts` (+ spec), `src/common/domain/utils/mask-email-addresses.ts` (+ spec), `src/common/presentation/filters/http-exception.filter.spec.ts`, `test/support/capturing-logger.ts`, `test/e2e/security/{http-hardening,rate-limiting,log-redaction}.e2e-spec.ts`, `scripts/security/{audit,secrets}.mjs`, `security/audit-exceptions.json`, `.gitleaks.toml`, `docs/security/{npm-audit,secret-scan}.md`, this file.
Modified: `src/main.ts` (1.5), `src/common/presentation/filters/http-exception.filter.ts` (1.5), `src/common/presentation/utils/sanitize-body.util.ts` (1.3) + spec (1.1), `src/common/infrastructure/docs/openapi-routes.ts` (1.1), `src/common/infrastructure/docs/openapi-enricher.ts` (1.1), `src/features/auth/presentation/controllers/auth.controller.ts` (1.3), `src/i18n/{en,es}/common.json`, `test/support/e2e-app.ts` (1.3), `scripts/simulate-ventilator.ts` (1.1), `openapi/openapi.json`, `packages/api-client/src/schema.d.ts`, `package.json` (`security:audit`, `security:secrets`), `package-lock.json`, skills `error-handling`, `authorization`, `swagger`.

## Observed results

```text
npx tsc --noEmit -p tsconfig.json                                → 0 errors
npx eslint <19 changed/new .ts files>                            → 0 problems (after --fix of 3 style errors)
npx madge --circular --extensions ts src                         → no circular dependency (1817 files)
unit (filters, logging, http, docs, domain utils, presentation utils, auth) → 18 suites, 160/160
contract (test:contract)                                         → 2 suites, 11/11
e2e security + authorization matrix + api-contract               → 5 suites, 376/376
e2e health + idor + resilience/ai-sse (sanity, e2e-app changed)  → 3 suites, 42/42
npm run openapi:check                                            → up to date
npm run security:audit                                           → exit 0 (6 critical/high advisories, all excepted); exit 1 with an empty exceptions file
npm run security:secrets                                         → exit 0, 0 findings (88 commits)
docker ps                                                        → no leftover test containers
```

The whole e2e suite and `npm run verify` were not run (low memory); they remain for the author.
