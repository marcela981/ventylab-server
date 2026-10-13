<!--
  Funcionalidad: Escaneo de secretos del historial git
  Descripción: Cómo se ejecuta gitleaks en Docker sobre todo el historial git, reglas propias y listas de permitidos justificadas, resultado del escaneo (sin valores de secretos: regla, archivo, commit, primeros 4 caracteres y longitud) y secretos a rotar
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# Secret scan of the git history

Observed on 2026-10-13 on branch `main` (90 commits reachable from all refs; gitleaks scanned the 88 that carry a diff).

## How it runs

`npm run security:secrets` (`scripts/security/secrets.mjs`) runs `zricethezav/gitleaks:v8.21.2` pinned by digest (`sha256:0e99e882…7f46`) in Docker; nothing is installed on the host. The repository is mounted read-only (`:ro`) and scanned in `git` mode (full history, all refs) with `.gitleaks.toml`. The JSON report is written to a temporary directory that is deleted right after it is read; the script prints rule, file, line, commit and date, and only the first 4 characters and the length of each secret. Exit 0 = no findings, 1 = findings, 2 = Docker or the `.git` directory unavailable. The working tree is not scanned (it holds the untracked `.env` files, which must not be read); history was not rewritten.

## Rules

- gitleaks default rules (`[extend] useDefault = true`).
- `ventylab-env-secret`: a value of 8+ characters assigned to one of this backend's secret variables (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_BRIDGE_SECRET`, `ADMIN_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANALYTICS_EXPORT_SALT`, `INFLUXDB_TOKEN`, `MQTT_PASSWORD`, `SMTP_PASS`, the AI provider keys, `GOOGLE_CLIENT_SECRET`, `SENTRY_DSN`, `POSTGRES_PASSWORD`).
- `ventylab-postgres-url-password`: a `postgres(ql)://user:password@host` URL.

Both custom rules were checked against a synthetic file: a realistic `JWT_SECRET` and a PostgreSQL URL with a password on a remote host were reported, while placeholders, `test-` values and a `localhost` URL were not.

## Allowlist (each entry justified in `.gitleaks.toml`)

| Rule | Allowed | Why |
|---|---|---|
| env secret | placeholders: `your-…`, Spanish `tu-…`, `change-me`, `<…>`, `${…}`, `xxxx`, `****` | documentation and `.env.example` templates |
| env secret | a code reference ending in `(` (`requireEnv(`), `process.env…` | the line reads the variable, it holds no value |
| env secret | `test-…` and `verify-…` values | fixed values of the automated test environment and of the disposable boot check; valid only in those throw-away processes |
| env secret | literal fixture words such as `refresh-secret` | unit test configuration |
| PostgreSQL URL | host `localhost`, `127.0.0.1`, `[::1]` | disposable local databases (offline OpenAPI generator, local compose) |
| PostgreSQL URL | passwords `password`, `postgres`, `ventylab_test`, placeholders | documented defaults and the fixed Testcontainers credentials (host resolved at runtime) |

## Result

| Run | Findings |
|---|---|
| Default rules only | 0 ("no leaks found") |
| `.gitleaks.toml` before the allowlist | 12, all fake (below) |
| `.gitleaks.toml` (final) | **0** |

The 12 findings that led to the allowlist (none looks real):

| Rule | File | Commit | Secret | Assessment |
|---|---|---|---|---|
| ventylab-env-secret | `test/support/auth.ts:40` | 669c1374a50e | `requ…` (11) | code `requireEnv(` — not a value |
| ventylab-postgres-url-password | `test/support/containers.ts:113` | 669c1374a50e | `vent…` (13) | Testcontainers fixed credentials |
| ventylab-env-secret | `scripts/verify/boot-from-scratch.mjs:44,46,48,49,50` | 1152bd49afcc | `veri…` (25–43) | boot-check dummy values |
| ventylab-env-secret | `src/features/auth/infrastructure/jwt/jwt-token-generator.spec.ts:20` | f886d1501c53 | `refr…` (14) | unit test fixture |
| ventylab-env-secret | `AUTH_DOCUMENTATION.md:14,18` | ba0652fc439a | `tu-s…` (24), `tu-g…` (23) | Spanish placeholders |
| ventylab-env-secret | `FRONTEND_BACKEND_DEPENDENCIES_REPORT.md:364,366` | ba0652fc439a | `tu-s…` (14), `tu-g…` (23) | Spanish placeholders |

## Rotate

Nothing to rotate: no real-looking secret was found in the git history.

The working tree was intentionally not scanned. Before the first commit of the new deployment files (`docker-compose*.yml`, `deploy/**`, still untracked), run `npm run security:secrets` again after committing them, or review them by hand: they must only hold `${VAR:?…}` references.
