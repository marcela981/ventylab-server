<!--
  Funcionalidad: Manual de operación (runbook)
  Descripción: Síntomas, diagnóstico y acciones para incidentes del backend: broker MQTT caído, ventilador sin datos, proveedor de IA caído, base de datos lenta, restauración de respaldos y rotación de secretos, migraciones y despliegue controlado. v1.2: la base de producción es PostgreSQL en Dokploy (VPS), no Supabase. v1.3 (Bloque 1): migraciones al desplegar. v1.4 (Bloque 4): sin secretos del puente retirado; el cambio de contraseña revoca los refresh tokens. v1.5: despliegue controlado desde CI (API o webhook de Dokploy, Auto Deploy apagado) y GET /api/version para comprobar el commit desplegado. v1.6: la clave del proveedor externo (AI_EXTERNAL_API_KEY) reemplaza a la del proveedor HTTP personalizado. v1.7: en modo API, el job deploy sella GIT_SHA y BUILD_DATE en los argumentos de construcción de Dokploy antes de cada despliegue
  Versión: 1.7
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Runbook

Symptoms → diagnosis → actions for the incidents expected in operation. Every endpoint, log message and variable below exists in the code; variable names are validated in `src/common/infrastructure/config/env.validation.ts`. Never paste secret values into tickets, logs or this document.

## Tools for every incident

| Tool | Access | What it tells you |
| --- | --- | --- |
| `GET /health` (also `/`, `/api/health`) | public | Liveness: the process answers `{ status: "ok" }`. |
| `GET /health/ready` (also `/api/health/ready`) | public | Readiness: `SELECT 1` within `HEALTH_CHECK_TIMEOUT_MS` (default 2000). `200 { status: "ready" }` or `503 { status: "not_ready" }`. Controller: `src/common/presentation/controllers/health.controller.ts`. |
| `GET /api/version` | public | Deployed build: `{"sha","builtAt","contract"}` (raw JSON, `unknown` when the image was built without `GIT_SHA`/`BUILD_DATE`). Use it to confirm a deploy (section 8). |
| `GET /api/system/status` | `system:status` (TEACHER, ADMIN) | Global `OK / DEGRADED / DOWN` and components `database`, `mqttBroker`, `ventilator`, `aiProviders`, `storage`, `process`, cached `SYSTEM_STATUS_CACHE_SECONDS`. Rules in `src/features/system-status/domain/system-status.ts`; details in [docs/operation/SYSTEM-STATUS.md](operation/SYSTEM-STATUS.md). Socket event `system:status-changed` reaches `role:ADMIN` and `role:TEACHER` on every transition. |
| `POST /api/system/probe/ai/:provider` | `system:probe` (ADMIN), 3/min | One minimal real call to a provider; returns `ok: false` with an error code instead of failing. |
| `GET /api/ventilator/telemetry/metrics` (+ `metrics.csv`) | `ventilator:metrics` (TEACHER, ADMIN); `POST metrics/reset` needs `ventilator:metrics_reset` (ADMIN) | Messages per second, latencies, `invalidMessages`, `lostMessages`, `bufferDrops`. |
| `GET /api/admin/ai-telemetry/stats` (+ `export.csv`) | `ai-telemetry:read` | AI calls by status, provider, latency and cost from `ai_call_logs`. |
| Logs | stdout | Production: JSON lines from `AppLogger` (`src/common/infrastructure/logging/app-logger.service.ts`) with `level`, `timestamp`, `context`, `message`, `traceId`, `stack` (errors) and `details`. |
| Sentry | `SENTRY_DSN` set | Unexpected (non-domain) exceptions and outbound HTTP errors. Initialized in `src/instrument.ts` only when the DSN is set. |

Correlating a request: every response carries `x-trace-id`/`x-request-id` (`src/common/presentation/middlewares/trace-id.middleware.ts`); search the logs for that `traceId`. There is **no per-request access log**: only exceptions are logged, by `src/common/presentation/filters/http-exception.filter.ts` (message "Exception occurred", with `traceId`, `userId`, method, path, sanitized body, query, params and status code). Persisted errors live in `error_logs`, purged daily after 30 days (constant `ERROR_LOG_RETENTION_DAYS` in `src/common/infrastructure/logging/error-log/error-log-purge.service.ts`).

## 1. MQTT broker down

**Symptoms**

- Students and teachers see the ventilator as disconnected; socket event `ventilator:disconnected { reason: "broker_disconnected" }`.
- Commands answer 503 `ventilator-commands.device_offline` (a command whose publish failed is stored as `REJECTED`).
- `GET /api/system/status`: `mqttBroker: down`, global `DEGRADED`.
- Logs (context `MqttVentilatorConnection`): repeated `MQTT error (<broker>): ...`; on recovery `MQTT connected to <broker>`.

**Diagnosis**

1. `mqttBroker: not_configured` instead of `down` means `MQTT_BROKER_URL` (alias `MQTT_URL`) is not set; the log shows `MQTT_BROKER_URL is not set: the physical ventilator connection is disabled`. That is a configuration problem, not an outage.
2. Check the broker itself (process, host, port, TLS) and network reachability from the server host.
3. Authentication errors in `MQTT error (...)` point to `MQTT_USERNAME` / `MQTT_PASSWORD` (see section 6).
4. `MQTT client could not be created for ...` at boot means an invalid URL.

**Actions**

- Restore the broker. **No server restart is needed**: the client in `src/features/ventilator-telemetry/infrastructure/mqtt/` reconnects forever with exponential backoff and jitter between `MQTT_RECONNECT_BASE_MS` (1000) and `MQTT_RECONNECT_MAX_MS` (30000), and re-subscribes on every connect.
- Tell the session's operator: the server never resends commands; anything sent while down must be sent again after recovery.
- If the broker will be down for the rest of a reserved session, cancel or let the reservation end; control is revoked automatically and no command is sent.

## 2. Ventilator sends no data

**Symptoms**

- Broker connected (`mqttBroker: up`) but charts are frozen; `ventilator:disconnected { reason: "device_stale" }` after `VENTILATOR_STALE_AFTER_MS` (default 2000) without messages.
- `ventilator: down` (offline during an active reservation, global `DEGRADED`) or `idle` (offline, no active reservation).
- Commands answer 503 `device_offline`.

**Diagnosis**

1. Metrics (`GET /api/ventilator/telemetry/metrics`): `messagesPerSecond` = 0 means nothing arrives on `MQTT_TELEMETRY_TOPIC` (default `/ventynet/data`). Subscribe to that topic with an MQTT client to see if the device/bridge publishes at all.
2. `invalidMessages` increasing means messages arrive but do not decode: check `VENTILATOR_TELEMETRY_DECODER` (`auto`, `json`, `hex`) against what the device sends; the frame contract is in [docs/ventilator/telemetry.md](ventilator/telemetry.md). A warning is logged at most once per `VENTILATOR_INVALID_LOG_INTERVAL_MS`.
3. Topic mismatch: the device publishes to a different topic than `MQTT_TELEMETRY_TOPIC`.
4. Data arrives but a student sees nothing: they may not hold the active reservation (`ventilator:join-rejected`); teachers and admins always receive telemetry.
5. Device side: power, network, Node-RED/ESP bridge.

**Actions**

- Fix the device, bridge or topic. The first message afterwards emits `ventilator:connected`; no restart needed.
- To check the pipeline without the device, run `scripts/simulate-ventilator.ts` against a **test broker/topic** you control. Warning: when `MQTT_BROKER_URL` is unset it falls back to the public `test.mosquitto.org` broker; never point it at the production telemetry topic while students are connected.
- Latency investigation: [docs/ventilator/telemetry-bench.md](ventilator/telemetry-bench.md).

## 3. AI provider down

**Symptoms**

- Feedback, tutor or assistant answers are generic (deterministic fallback) or the request fails with 503 (`AiProvidersUnavailableError`) when the use case has no fallback.
- `GET /api/system/status`: `aiProviders: degraded` (some breaker open) or `down` (every configured provider unavailable, global `DEGRADED`).
- Logs (context `AiOrchestrator`): `AI provider <id> failed (<kind>), retrying` and `AI provider <id> failed (<code>), trying the next provider`.

**How the gateway behaves** (`src/features/ai/application/services/ai-orchestrator.ts`, `ai-circuit-breaker.ts`)

- Providers are tried in the configured order (default gemini → openai → anthropic → custom), skipping unregistered providers and those with an open breaker.
- One retry per provider on rate-limit, server or network errors, delayed by the code constant `AI_RETRY_DELAY_MS` (500 ms × attempt, `src/features/ai/infrastructure/config/ai-settings.provider.ts`); a timeout moves to the next provider without retry. Per-use-case timeouts come from the AI settings (platform settings with config defaults).
- The breaker opens after `AI_BREAKER_FAILURE_THRESHOLD` consecutive failures for `AI_BREAKER_OPEN_SECONDS`, in memory.
- If every provider fails, the consumer's deterministic `fallback` answers and the call is logged with status `FALLBACK`.
- Every call writes one `ai_call_logs` row (`provider`, `model`, `status` in `SUCCESS | ERROR | FALLBACK | BLOCKED_OFFTOPIC | QUOTA_EXCEEDED | ABORTED`, `error_code`, `attempts`, `latency_ms`, ...).

**Diagnosis**

1. `GET /api/admin/ai-telemetry/stats`: rising `FALLBACK`/`ERROR` per provider and the error codes.
2. `POST /api/system/probe/ai/<provider>`: `ok: false` + error code. 422 means the provider has no credentials; 404 an unknown provider.
3. Error code meaning: authentication → key revoked or wrong (section 6); rate limit → provider quota; timeout/network → provider outage.
4. 429 with `Retry-After` for one user is the **per-user daily quota** (`AiQuotaExceededError`), not an outage.

**Actions**

- Provider outage: nothing to do; the next provider or the fallback answers. Optionally remove it from the use case's `providerChain` in `/api/platform-settings` (ADMIN; registry in `src/features/platform-settings/domain/registry/platform-settings.registry.ts`).
- Invalid key: rotate it (section 6).
- Provider-side quota: raise it with the provider or move traffic to another provider.

## 4. Slow or restarting database (PostgreSQL on Dokploy, VPS)

**Symptoms**

- `GET /health/ready` answers 503 while `/health` answers 200.
- `GET /api/system/status`: `database: down` → global `DOWN`.
- Slow or failing requests; exceptions from Prisma in the logs. At boot, the app may fail to start.

**Diagnosis**

1. `PrismaService` (`src/common/infrastructure/persistence/prisma/prisma.service.ts`) calls `$connect()` once at startup **without retry**, so an unreachable database at boot stops the start; a database that becomes slow later only fails requests and readiness.
2. Readiness has a hard budget: a `SELECT 1` slower than `HEALTH_CHECK_TIMEOUT_MS` counts as not ready.
3. PostgreSQL on Dokploy (VPS): check the database service status and logs in Dokploy (a stopped or restarting container refuses or delays the first connections) and the free disk and memory of the VPS. `DATABASE_URL` (runtime) and `DIRECT_URL` (migrations) must both be valid.
4. No pool or connection-timeout variables are defined by this code; any `connection_limit`/`pool_timeout` must be part of the connection string.

**Actions**

- Database restart: wait until the Dokploy database service is running again, then check `/health/ready`; restart the server if it failed at boot.
- Persistent slowness: check slow queries on the PostgreSQL on Dokploy (VPS) database (`pg_stat_activity` from the service terminal); reduce load (cached panels already hold 60 s, system status 5–10 s).
- Do not raise `HEALTH_CHECK_TIMEOUT_MS` to hide a slow database; it is bounded 100–10000 ms.

## 5. Backup restore

Procedure, scripts and verification: [docs/operations/backup-restore.md](operations/backup-restore.md) (created with the deploy and operations files of block F; if it is not there yet, that block is still pending).

Before restoring:

- Stop the server (or answer 503) so no writes land on a half-restored database.
- Restore into a new database first and check it, then switch `DATABASE_URL`/`DIRECT_URL`.
- After restoring, run `prisma migrate deploy` only if the dump predates migrations, and remember that the database triggers (`audit_logs` append-only, `protect_superadmin()`) are part of the migrations and must exist after the restore.

## 6. Secret rotation

All secrets are environment variables read at boot through `ConfigService`; **every rotation needs a server restart**. Secrets are never platform settings. The table says what stops working when each one changes.

| Secret | Used by | What a rotation invalidates | Steps |
| --- | --- | --- | --- |
| `JWT_SECRET` | access tokens (`src/features/auth/auth.module.ts`), Socket.io handshake (through `ACCESS_TOKEN_VERIFIER_TOKEN`) | Every access token at once: HTTP 401 and socket handshakes rejected. Refresh tokens stay valid, so clients that refresh on 401 recover. | Set the new value, restart, watch 401s fall after clients refresh. |
| `JWT_REFRESH_SECRET` | refresh tokens (`src/features/auth/infrastructure/jwt/jwt-token-generator.ts`) | Every refresh token: users must sign in again when their access token (`JWT_EXPIRES_IN`) expires. | Rotate outside class hours. |
| Per-user revocation | `users.refreshTokensRevokedAt` | Refresh tokens of **one** user issued before that instant (401 on refresh). Set by password change, role change and deactivation (`src/features/users/domain/entities/user.entity.ts`); `POST /api/auth/change-password` reissues the pair of the session that changed it. Access tokens stay valid until they expire: `JwtAuthGuard` is stateless and logout only tells the client to discard tokens. | Prefer this over a global rotation for a single compromised account. |
| `ADMIN_API_KEY` | `src/common/presentation/guards/admin-api-key.guard.ts` (`x-admin-api-key`) | Nothing today: no route uses that guard. | Optional; rotate anyway if leaked, or unset it. |
| `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_EXTERNAL_API_KEY` | AI providers | Only that provider until the new key is set; the gateway falls over to the next provider or the fallback meanwhile (section 3). | Create the new key at the provider, set it, restart, `POST /api/system/probe/ai/<provider>`, then revoke the old key. |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | broker connection | The server's broker connection when the broker changes credentials (section 1 symptoms). The device has its own credentials on the broker. | Add the new credentials on the broker, update the server, restart, then remove the old ones. |
| DB password (inside `DATABASE_URL` and `DIRECT_URL`) | Prisma | The whole API (readiness 503, status `DOWN`) until both URLs use it. | Change the role password on PostgreSQL on Dokploy (VPS) (`ALTER ROLE`), update both URLs, restart, check `/health/ready`. |
| `SUPABASE_SERVICE_ROLE_KEY` | media storage | Uploads and storage checks (`storage: down`). | Rotate in Supabase, update, restart. |
| `ANALYTICS_EXPORT_SALT` | HMAC pseudonyms of the research export | Pseudonymous IDs change: new exports cannot be joined with old ones. Not a session secret. | Rotate only if leaked, and record the date for researchers. |
| `SENTRY_DSN` | error reporting | Events stop reaching the old project. No user impact. | Rotate in Sentry, update, restart. |
| `GOOGLE_CLIENT_SECRET`, `SMTP_PASS`, `INFLUXDB_TOKEN` | Google sign-in, e-mail, optional InfluxDB sink | Only that integration. | Rotate at the provider, update, restart. |

After any rotation: `GET /health/ready`, `GET /api/system/status`, a sign-in, and a check that no new `Exception occurred` entries appear.

## 7. Database migrations on deploy

Migrations are applied automatically: `deploy/docker-entrypoint.sh` runs `prisma migrate deploy` (through `DIRECT_URL`) every time the container starts, before `node dist/main`, and refuses to start the application if it fails. Dokploy needs no extra step.

- **Symptom:** the container restarts in a loop and the log shows `[entrypoint] prisma migrate deploy failed; refusing to start the application`.
- **Diagnosis:** read the Prisma error above that line (connectivity through `DIRECT_URL`, a failed migration recorded in `_prisma_migrations`, or a lock held by another process).
- **Action:** fix the cause (database reachable, `DIRECT_URL` correct), and for a migration marked as failed resolve it with `prisma migrate resolve` after checking the database state, then redeploy. Never edit an already applied `migration.sql`.

## 8. Controlled deploy

Production only receives a `main` commit that passed `verify`. The `deploy` job of `.github/workflows/ci.yml` runs on a push to `main`, after `verify`, and asks Dokploy to deploy. Dokploy then builds this repository with its `Dockerfile` and the entrypoint applies the migrations (section 7).

**Rule: Dokploy must not deploy on push by itself.** Otherwise a red `main` reaches production before CI finishes.

### Two ways to trigger it

The job picks the first one that is configured in GitHub → repository → Settings → Secrets and variables → Actions:

| Mode | Secrets | Auto Deploy in Dokploy | Use it when |
| --- | --- | --- | --- |
| **API** (preferred) | `DOKPLOY_URL` (panel origin, for example `https://dokploy.example.com`), `DOKPLOY_API_KEY`, `DOKPLOY_APPLICATION_ID` | **OFF** | Always possible. `POST <DOKPLOY_URL>/api/application.deploy` with header `x-api-key` does not look at Auto Deploy. |
| **Webhook** | `DOKPLOY_DEPLOY_WEBHOOK` (the full webhook URL) | must be **ON** | The application's source does not push to Dokploy by itself (see the warning below). |

Neither configured: the job prints a `Deploy skipped` warning and stays green, so CI is not red before the secrets exist. Deploy manually meanwhile (below).

**Webhook caveat (checked against the Dokploy source, `apps/dokploy/pages/api/deploy/[refreshToken].ts`).** The webhook endpoint answers `400 "Automatic deployments are disabled for this application"` while Auto Deploy is off. It answers `301 "Branch Not Match"` when the body's `ref` is not the configured branch. The job sends a push-shaped body (`ref: refs/heads/main`, header `X-GitHub-Event: push`) and fails on any non-2xx answer. With Auto Deploy ON and the application connected through the Dokploy GitHub provider, GitHub pushes also reach Dokploy directly and deploy before CI. So the webhook mode is controlled only if the application uses a source that has no push hook to Dokploy (for example the generic Git source). Otherwise use the API mode with Auto Deploy OFF.

### Setup

1. Dokploy → application → **General**: turn **Auto Deploy** off (API mode). Check that the branch is `main` and the build type is Dockerfile.
2. API mode:
   - `DOKPLOY_API_KEY`: Dokploy → Settings → Profile → API/CLI → generate a key.
   - `DOKPLOY_APPLICATION_ID`: the application id, shown in the application URL in the panel.
   - `DOKPLOY_URL`: the panel origin, without a trailing `/api`.
   Store the three values as GitHub Actions secrets with those names.
3. Webhook mode instead: Dokploy → application → **Deployments** tab → copy the **Webhook URL** (`https://<dokploy>/api/deploy/<refresh token>`). Store it as the secret `DOKPLOY_DEPLOY_WEBHOOK`. The refresh token in that URL is a credential: if it leaks, regenerate it from the same tab (refresh token) and update the secret.
4. `/api/version` needs no manual step in API mode: before `application.deploy`, the job stamps the build arguments (below). In webhook mode nothing is stamped: `sha` and `builtAt` read `unknown` unless `GIT_SHA`/`BUILD_DATE` are set by hand in Dokploy (see [environment variables](operations/environment-variables.md#image-build-arguments-dockerfile)); the check below then relies on the Dokploy deployment.

### Build arguments stamped by the deploy job (API mode)

Dokploy builds the image from the repository and does not pass the commit to the `Dockerfile` by itself (the build context has no `.git`, see `.dockerignore`). So the `deploy` job, in API mode, does three calls with the same `x-api-key`:

1. `GET <DOKPLOY_URL>/api/application.one?applicationId=<id>`: reads the application's current `env`, `buildArgs`, `buildSecrets` and `createEnvFile`.
2. `POST <DOKPLOY_URL>/api/application.saveEnvironment`: writes the same `env`, `buildSecrets` and `createEnvFile` back unchanged and the build arguments with `GIT_SHA=<pushed commit>` and `BUILD_DATE=<UTC time of the job>`. Any other build argument line is kept in order; earlier `GIT_SHA`/`BUILD_DATE` lines are replaced. The merge is `scripts/ci/dokploy-build-args.mjs` (tested by `node --test scripts/ci/dokploy-build-args.test.mjs` in `verify`).
3. `POST <DOKPLOY_URL>/api/application.deploy` (as before).

Rules and failure modes:

- `saveEnvironment` requires every field (Dokploy validates the body with `.required()`), so a missing field would be erased. If `application.one` does not return `env`, `buildArgs`, `buildSecrets` and `createEnvFile` (for example an older Dokploy), the script stops with `Dokploy application.one is missing ...` and the job fails **without deploying and without changing anything**. Upgrade Dokploy or deploy manually.
- Any non-2xx answer of steps 1 or 2 fails the job with `Build arguments not stamped` and the HTTP status; nothing is deployed. Re-run the failed job.
- The values read from Dokploy (environment variables included) only live in a private temporary directory of the runner, removed when the step ends, and are never printed. The API key needs permission to write the application's environment (the same key that deploys; no new secret).
- The panel's **Environment → Build Time Arguments** shows the last stamped `GIT_SHA`/`BUILD_DATE`. Do not edit those two lines by hand: the next deploy replaces them. An edit of the environment saved in the panel while the job runs (between steps 1 and 2) would be overwritten; deploys are serialized (`concurrency: deploy-production`), so only a simultaneous manual edit can race.
- `BUILD_DATE` is the time the job asked for the build, a few seconds before Dokploy starts it.

Never paste the webhook URL, the API key or the panel URL into logs, issues or this document. The job never prints them: curl runs without `--show-error` and the log shows only the HTTP status, the curl exit code and Dokploy's short message.

### Verify that the new commit is live

1. GitHub Actions: the `deploy` job of the push is green and says `Dokploy queued the deploy of <sha>`.
2. Dokploy → application → Deployments: the latest deployment finishes as done. Its log ends with `Nest application successfully started`.
3. `curl -s https://<api domain>/api/version`. The answer is `{"sha":"<sha>","builtAt":"<ISO date>","contract":1}`. In API mode `sha` must equal the pushed commit (`git rev-parse origin/main`) and `builtAt` must be newer than the push; the job log line `Stamped GIT_SHA=<short sha>` shows what was stamped. `contract` must be the value the web requires.
4. `curl -s https://<api domain>/health/ready` answers `{"status":"ready"}`.

### Manual redeploy (fallback)

When the secrets are missing, the job failed (for example Dokploy was unreachable: `HTTP 000 (curl exit 7)`), or a rollback is needed:

- Dokploy → application → **Deploy** (or **Redeploy**) for the current `main` commit. Then run the checks above.
- Rollback: revert the commit on `main` (a new commit that goes through CI). If production is down and CI cannot wait, deploy the previous good commit from Dokploy. Note that migrations are never rolled back automatically (section 7).
- Re-run only the deploy: GitHub Actions → the `main` run → **Re-run failed jobs**. `verify` is not repeated if it passed.
