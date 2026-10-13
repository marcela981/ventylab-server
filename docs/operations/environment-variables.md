<!--
  Funcionalidad: Referencia de variables de entorno
  Descripción: Lista cada variable que valida env.validation.ts, las que se leen antes del arranque de Nest (Sentry), las de pruebas y herramientas y las de interpolación de docker-compose, con obligatoriedad, valor por defecto, descripción y ejemplo no real
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Environment variables

Source of truth: `src/common/infrastructure/config/env.validation.ts` (`EnvironmentVariables`). The app validates them at startup and stops with `Invalid environment configuration:` plus one line per missing or invalid variable. Numbers and booleans arrive as strings and are converted (`true`/`false` only). A ready-to-copy template with these values is in `deploy/env.example.proposed`.

"Required" means startup fails without it. Examples are not real values.

## Runtime

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `production` or `test`. Production enables JSON logs, CSP and the ADMIN-only `/api/docs`; `test` prefixes MQTT command/ACK topics with `MQTT_TEST_TOPIC_PREFIX`. The container image and `docker-compose.yml` force `production`. | `production` |
| `PORT` | no | `4000` | HTTP and Socket.io port. | `4000` |
| `APP_VERSION` | no | `version` of `package.json` | Version reported by the system status. | `1.0.0` |
| `APP_COMMIT_SHA` | no | value of `GIT_COMMIT` | Commit reported by the system status. | `3f2c1ab` |
| `GIT_COMMIT` | no | — | Alias of `APP_COMMIT_SHA` (used only when that one is unset). | `3f2c1ab` |

## Database

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `DATABASE_URL` | yes | — | PostgreSQL URL used by Prisma at runtime (may be a pooled Supabase URL). | `postgresql://ventylab:change-me@db.example.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | yes | — | Direct (non-pooled) URL; `prisma migrate deploy` (container entrypoint) uses it, and it is the URL to give the backup scripts (without Prisma-only query parameters). | `postgresql://ventylab:change-me@db.example.com:5432/postgres` |

## Auth

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `JWT_SECRET` | yes | — | Signs access tokens. Long random string. | `change-me-32-random-chars` |
| `JWT_EXPIRES_IN` | yes | — | Access token lifetime (`ms`-style duration). | `15m` |
| `JWT_REFRESH_SECRET` | yes | — | Signs refresh tokens; different from `JWT_SECRET`. | `change-me-other-32-random-chars` |
| `JWT_REFRESH_EXPIRES_IN` | yes | — | Refresh token lifetime. | `7d` |
| `NEXTAUTH_SECRET` | yes | — | Same secret as the frontend NextAuth, to verify its tokens in the bridge. | `change-me` |
| `NEXTAUTH_BRIDGE_SECRET` | yes | — | Shared secret of the `x-nextauth-bridge-secret` header (server-to-server bridge). | `change-me` |
| `ADMIN_API_KEY` | yes | — | Value of the `x-admin-api-key` header accepted by `AdminApiKeyGuard`. | `change-me` |
| `SUPERADMIN_EMAIL` | yes | — | Account forced to ADMIN and active at startup; its role and status are immutable. Must be an email. | `superadmin@example.com` |
| `GOOGLE_CLIENT_ID` | no | — | Google sign-in client ID. | `example.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | no | — | Google sign-in client secret. | `change-me` |
| `ALLOWED_EMAIL_DOMAINS` | no | empty (any domain) | Comma-separated domains allowed for Google sign-in (leading `@` optional, case-insensitive). | `example.edu.co,example.com` |

## CORS and origins

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `CORS_ORIGIN` | yes | — | Comma-separated allowed origins for HTTP and Socket.io; `*` allows any origin. | `https://app.example.com` |
| `FRONTEND_URL` | yes | — | Frontend URL; also added to the allowed origins. | `https://app.example.com` |
| `PRODUCTION_URL` | yes | — | Production frontend URL; also added to the allowed origins. | `https://app.example.com` |
| `VERCEL_URL` | no | — | Host of a Vercel deployment; `https://<value>` is added to the allowed origins. | `example-app.vercel.app` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | no | `false` | `true` accepts every `https://*.vercel.app` origin (preview deployments). Keep `false` in production. | `false` |

## Rate limiting, observability and API docs

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `THROTTLE_TTL` | no | `60000` | Global throttler window (ms). | `60000` |
| `THROTTLE_LIMIT` | no | `100` | Requests per window and client. | `100` |
| `SENTRY_DSN` | no | — | Sentry is initialized (in `src/instrument.ts`, before Nest boots, through `readSentryConfig()`) only when this is set and not empty. | `https://examplePublicKey@o0.ingest.sentry.io/0` |
| `SWAGGER_ALLOWED_IPS` | no | empty | Extra source-IP restriction for `/api/docs` and `/api/docs-json`: comma-separated IPs; `*` or empty means no IP restriction. Whether the docs are open is decided by `NODE_ENV`: open outside production, and in production only for a request with an `ADMIN` access token (anything else answers 404). | `203.0.113.10,198.51.100.7` |
| `HEALTH_CHECK_TIMEOUT_MS` | no | `2000` (100–10000) | Database ping timeout of `/health/ready` and the system status checks. | `2000` |
| `SYSTEM_STATUS_CACHE_SECONDS` | no | `5` (5–10) | Cache of `GET /api/system/status`. | `5` |

## Mail

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `SMTP_HOST` | yes | — | SMTP server host. | `smtp.example.com` |
| `SMTP_PORT` | yes | — | SMTP port. | `587` |
| `SMTP_FROM` | yes | — | Sender address. | `no-reply@example.com` |
| `SMTP_USER` | no | — | SMTP user. | `example-user` |
| `SMTP_PASS` | no | — | SMTP password. | `change-me` |
| `SMTP_SECURE` | no | `false` | `true` for implicit TLS (port 465). | `false` |

## MQTT (physical ventilator)

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `MQTT_BROKER_URL` | no | — | Broker URL; telemetry and commands are enabled only when it (or `MQTT_URL`) is set. In `docker-compose.yml` it is forced to `mqtt://mosquitto:1883`. | `mqtt://mosquitto:1883` |
| `MQTT_URL` | no | — | Alias of `MQTT_BROKER_URL` (used only when that one is unset). | `mqtt://localhost:1883` |
| `MQTT_CLIENT_ID` | no | generated | MQTT client ID. | `ventylab-server` |
| `MQTT_USERNAME` | no | — | Broker user (compose: `MQTT_BACKEND_USERNAME`). | `ventylab-backend` |
| `MQTT_PASSWORD` | no | — | Broker password (compose: `MQTT_BACKEND_PASSWORD`). | `change-me` |
| `MQTT_TELEMETRY_TOPIC` | no | `/ventynet/data` | Telemetry topic (subscribed). | `/ventynet/data` |
| `MQTT_COMMAND_TOPIC` | no | `ventilab/device/001/command` | Command topic (published, QoS 1). | `ventilab/device/001/command` |
| `MQTT_ALARM_TOPIC` | no | `ventilab/device/001/alarm` | Alarm topic (subscribed). | `ventilab/device/001/alarm` |
| `MQTT_COMMAND_ACK_TOPIC` | no | empty (ACK tracking off) | Command ACK topic. `deploy/mosquitto/acl` grants `ventilab/device/001/ack`. | `ventilab/device/001/ack` |
| `MQTT_TEST_TOPIC_PREFIX` | no | `test/ventylab` | Prefix of command/ACK topics when `NODE_ENV=test`; must start with a letter or digit. | `test/ventylab` |
| `MQTT_RECONNECT_BASE_MS` | no | `1000` (≥100) | Reconnect backoff base. | `1000` |
| `MQTT_RECONNECT_MAX_MS` | no | `30000` (≥1000) | Reconnect backoff cap. | `30000` |

When a topic changes, update `deploy/mosquitto/acl` too.

## Ventilator telemetry

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VENTILATOR_DEVICE_ID` | no | `ventilab-device-001` | Device identifier, also the reservation lock key. | `ventilab-device-001` |
| `VENTILATOR_TELEMETRY_DECODER` | no | `auto` | `auto`, `json` or `hex`. | `auto` |
| `VENTILATOR_FLUSH_INTERVAL_MS` | no | `33` (5–1000) | Socket batch flush interval. | `33` |
| `VENTILATOR_MAX_BUFFERED_FRAMES` | no | `256` (1–100000) | Max frames per batch buffer. | `256` |
| `VENTILATOR_STALE_AFTER_MS` | no | `2000` (≥250) | Inactivity before the device is reported stale. | `2000` |
| `VENTILATOR_ROOM_REFRESH_MS` | no | `1000` (≥100) | Room state refresh interval. | `1000` |
| `VENTILATOR_METRICS_WINDOW` | no | `10000` (10–1000000) | Metrics window size. | `10000` |
| `VENTILATOR_INVALID_LOG_INTERVAL_MS` | no | `5000` (≥0) | Minimum interval between invalid-frame logs. | `5000` |
| `VENTILATOR_RECORDING_HZ` | no | `20` (1–1000) | Recording sample rate. | `20` |
| `VENTILATOR_RECORDING_FLUSH_SECONDS` | no | `5` (1–3600) | Recording flush period. | `5` |
| `VENTILATOR_SEQ_REORDER_WINDOW` | no | `16` (0–1024) | Sequence reorder window. | `16` |
| `VENTILATOR_SEQ_WRAP_BITS` | no | `0` | Sequence wrap: `0` (none), `16` or `32`. | `0` |

## Ventilator commands

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `VENTILATOR_COMMAND_ENCODING` | no | `json` | `json` or `hex`. | `json` |
| `VENTILATOR_COMMAND_TIMEOUT_MS` | no | `3000` (100–60000) | Command ACK wait. | `3000` |
| `VENTILATOR_COMMAND_RATE_PER_SECOND` | no | `5` (0.1–100) | Per-user command rate. | `5` |
| `VENTILATOR_OPERATOR_GRACE_SECONDS` | no | `15` (0–600) | Operator grace period. | `15` |
| `VENTILATOR_CONTROL_REFRESH_MS` | no | `1000` (≥100) | Control state refresh. | `1000` |
| `VENTILATOR_APPLY_TOLERANCE_RATIO` | no | `0.05` (0–1) | Tolerance between commanded and applied parameters. | `0.05` |
| `VENTILATOR_SAFETY_MAX_PEEP` | no | `15` | Safety cap. | `15` |
| `VENTILATOR_SAFETY_MAX_PRESSURE_LIMIT` | no | `40` | Safety cap. | `40` |
| `VENTILATOR_SAFETY_MAX_TIDAL_VOLUME` | no | `700` | Safety cap. | `700` |
| `VENTILATOR_SAFETY_MAX_RESPIRATORY_RATE` | no | `35` | Safety cap. | `35` |
| `VENTILATOR_SAFETY_MAX_IE_RATIO` | no | `1` (0.1–4) | Safety cap. | `1` |

## Reservations

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `RESERVATION_MAX_DURATION_MINUTES` | no | `120` | Max reservation length. | `120` |
| `RESERVATION_SLOT_MINUTES` | no | `15` (1–60) | Slot granularity. | `15` |
| `RESERVATION_MAX_ADVANCE_DAYS` | no | `14` | How far ahead one can book. | `14` |
| `RESERVATION_MAX_FUTURE_PER_STUDENT` | no | `3` | Future reservations per student. | `3` |
| `RESERVATION_MAX_FUTURE_PER_GROUP` | no | `5` | Future reservations per group. | `5` |

## InfluxDB

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `INFLUXDB_URL` | no | — | InfluxDB v2 URL. | `http://influxdb:8086` |
| `INFLUXDB_TOKEN` | no | — | API token. | `change-me` |
| `INFLUXDB_ORG` | no | — | Organization. | `example-org` |
| `INFLUXDB_BUCKET` | no | — | Bucket. | `ventylab` |

## AI gateway

Providers: `gemini`, `openai`, `anthropic`, `custom`. Use cases: `GRADE_FEEDBACK`, `NOTES_ANALYSIS`, `PAGE_DEEPEN`, `LESSON_QA`, `FREE_CHAT`, `TOPIC_CHECK`, `SIM_ASSIST`. These values are the defaults of admin-editable platform settings.

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `GEMINI_API_KEY` | no | — | Gemini key. | `change-me` |
| `OPENAI_API_KEY` | no | — | OpenAI key. | `change-me` |
| `OPENAI_BASE_URL` | no | provider default | OpenAI-compatible base URL. | `https://api.openai.example.com/v1` |
| `ANTHROPIC_API_KEY` | no | — | Anthropic key. | `change-me` |
| `ANTHROPIC_BASE_URL` | no | provider default | Anthropic base URL. | `https://api.anthropic.example.com` |
| `AI_CUSTOM_HTTP_ENDPOINT` | no | — | Custom HTTP provider endpoint. | `http://llm.internal:8080/v1/complete` |
| `AI_CUSTOM_HTTP_AUTH_HEADER` | no | — | Header name sent to the custom provider. | `Authorization` |
| `AI_CUSTOM_HTTP_AUTH_VALUE` | no | — | Header value sent to the custom provider. | `Bearer change-me` |
| `AI_USE_CASE_SETTINGS` | no | code defaults | JSON per use case: `providerChain` (array of provider ids), `models` (provider → model), `timeoutMs`, `maxOutputTokens`, `temperature` (0–2). | `{"FREE_CHAT":{"timeoutMs":20000}}` |
| `AI_QUOTAS` | no | code defaults | JSON daily quotas: role (`STUDENT`, `TEACHER`, `ADMIN`) → use case or `*` → limit. | `{"STUDENT":{"*":50}}` |
| `AI_PRICES` | no | code defaults | JSON prices: provider → model → `{inputPer1kUsd, outputPer1kUsd}`. | `{"openai":{"example-model":{"inputPer1kUsd":0.001,"outputPer1kUsd":0.002}}}` |
| `AI_BREAKER_FAILURE_THRESHOLD` | no | `3` | Consecutive failures that open a provider circuit. | `3` |
| `AI_BREAKER_OPEN_SECONDS` | no | `60` | Open-circuit duration. | `60` |
| `AI_TUTOR_HISTORY_WINDOW` | no | `10` | Messages of history sent to the tutor. | `10` |
| `AI_TUTOR_CONTEXT_TOKEN_BUDGET` | no | `6000` (≥100) | Tutor context token budget. | `6000` |

A malformed JSON value stops startup with an error naming the variable and the offending path.

## Media storage

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `SUPABASE_URL` | no | — | Supabase project URL for Storage. | `https://example-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | no | — | Service role key (server only). | `change-me` |
| `SUPABASE_STORAGE_BUCKET` | no | — | Bucket name. | `media` |
| `MEDIA_MAX_IMAGE_BYTES` | no | `10485760` | Max image upload. | `10485760` |
| `MEDIA_MAX_FILE_BYTES` | no | `20971520` | Max file upload. | `20971520` |
| `MEDIA_MAX_VIDEO_BYTES` | no | `104857600` | Max video upload. | `104857600` |
| `MEDIA_SIGNED_URL_TTL_SECONDS` | no | `3600` (≥60) | Signed URL lifetime. | `3600` |

## Evaluation, simulation and analytics

| Variable | Required | Default | Description | Example |
|---|---|---|---|---|
| `EVALUATION_PASSING_GRADE` | no | `3.0` (0–5) | Minimum passing grade. | `3.0` |
| `SIMULATION_EVENT_TIME_TOLERANCE_MS` | no | `5000` | Simulated clock tolerance. | `5000` |
| `SIMULATION_ABANDON_AFTER_MINUTES` | no | `30` | Inactivity before a session is abandoned. | `30` |
| `SIMULATION_MAX_EVENT_BATCH_SIZE` | no | `200` (1–1000) | Max events per batch. | `200` |
| `ANALYTICS_EXPORT_SALT` | no | — | HMAC key (min 16 chars) of the anonymized research export; without it the export answers 503. | `change-me-at-least-16-chars` |

## Read outside `ConfigService`

| Variable | Where | Description |
|---|---|---|
| `SENTRY_DSN`, `NODE_ENV` | `src/common/infrastructure/config/sentry-config.ts` | Read before Nest boots (loads `.env` with dotenv, never overriding variables already set). |
| `RUN_DB_INTEGRATION` | `readDbIntegrationSettings()` in `env.validation.ts` | `1` enables DB integration tests (tests only). |
| `RUN_PERF_ASSERTIONS` | `engine-determinism.spec.ts`, set by `npm run test:perf` | Enables timing assertions (tests only). |
| `VERIFY_VERBOSE` | `scripts/verify/verify.mjs` | `1` streams step output (same as `--verbose`). |
| `AUDIT_BASE_URL`, `AUDIT_JWT_TOKEN` | `scripts/audit-e2e/e2e-config.ts` | Thesis audit scripts only. |

## docker-compose.yml interpolation (not read by the app)

| Variable | Required | Default | Description |
|---|---|---|---|
| `BACKEND_ENV_FILE` | no | `.env` | Env file loaded into the backend container. |
| `BACKEND_IMAGE` | no | `ventylab-server:local` | Image tag (for example a GHCR tag). |
| `API_DOMAIN` | yes | — | Public host of the API in the Traefik router. |
| `TRAEFIK_NETWORK` | no | `dokploy-network` | External Docker network shared with Traefik. |
| `TRAEFIK_HTTPS_ENTRYPOINT` / `TRAEFIK_HTTP_ENTRYPOINT` | no | `websecure` / `web` | Traefik entrypoints. |
| `TRAEFIK_CERT_RESOLVER` | no | `letsencrypt` | Traefik certificate resolver. |
| `MQTT_BIND_ADDRESS` / `MQTT_PUBLIC_PORT` | no | `127.0.0.1` / `1883` | Host binding of the broker port. |
| `MQTT_BACKEND_USERNAME` / `MQTT_BACKEND_PASSWORD` | password yes | `ventylab-backend` | Backend broker credentials (also injected as `MQTT_USERNAME`/`MQTT_PASSWORD`). |
| `MQTT_NODERED_USERNAME` / `MQTT_NODERED_PASSWORD` | password yes | `ventylab-nodered` | Node-RED broker credentials. |
| `MQTT_DEVICE_USERNAME` / `MQTT_DEVICE_PASSWORD` | password yes | `ventylab-device` | Physical device credentials. |
| `MQTT_HEALTHCHECK_USERNAME` / `MQTT_HEALTHCHECK_PASSWORD` | password yes | `ventylab-healthcheck` | Broker healthcheck credentials (read-only `$SYS/broker/version`). |
| `NODE_RED_CREDENTIAL_SECRET` | yes | — | Encrypts Node-RED flow credentials. |
| `NODE_RED_PORT` | no | `1880` | Loopback port of the Node-RED editor. |
| `TZ` | no | `America/Bogota` | Node-RED time zone. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | password when the `postgres` profile is used | `ventylab` / — / `ventylab` | Bundled PostgreSQL. |
