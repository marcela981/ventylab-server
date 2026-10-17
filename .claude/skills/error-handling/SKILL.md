---
name: error-handling
description: HTTP status mapping for domain errors, the global exception filter, validation error formatting, and error logging (console + database + Sentry) for this NestJS/DDD backend. Trigger on — editing `src/common/presentation/errors-map.ts`, touching `http-exception.filter.ts`, adding `@SkipLogError()`/`@SkipSaveErrorLog()`, wiring class-validator error messages, redacting secrets and masking emails in logged request bodies, queries and exceptions (`sanitizeBody`, `describeExceptionForLog`), Sentry event redaction (`registerSentryRedaction`), 413/429 responses (`common.payload_too_large`, `common.too_many_requests`), deciding an HTTP status for a new domain error, a domain error with translation arguments (`i18nArgs`), structured `details` returned in the error response `data`, or a retry time (`retryAt` → `Retry-After` header, 429/503), the `error_logs` table or its purge cron, reporting an error to Sentry from a cron/scheduler/event handler. For how to define the domain error class itself, see the domain-modeling skill.
---

# Error handling

Every exception is caught by one global filter and turned into a standardized `APIResponse` (see `presentation-layer` skill) with i18n applied.

## Error types → response

| Type             | Source                      | `code`                                             | Example                          |
| ---------------- | --------------------------- | -------------------------------------------------- | -------------------------------- |
| Domain error     | business rule violation     | the error's i18n key (e.g. `users.user_not_found`) | `throw new UserNotFoundError()`  |
| Validation error | class-validator on a DTO    | `validation_error`, `message` is an array, `data.errors` per field | `@MinLength(2)` failing          |
| HTTP exception   | NestJS framework exception, or a body-parser client error (`status` 4xx + `expose`) | mapped from the HTTP status; 413 and 429 use the translated `common.payload_too_large` / `common.too_many_requests` | `throw new ForbiddenException()`, `ThrottlerException` |
| Prisma known error | `P2002` unique violation / `P2025` record not found | `common.conflict` (409) / `common.not_found` (404) | duplicate key on insert |
| Unexpected error | unhandled (DB/network/etc.) | `internal_server_error`                            | —                                |

## Global exception filter

[http-exception.filter.ts](../../../src/common/presentation/filters/http-exception.filter.ts) is `@Catch()`-everything. It determines the exception type (`I18nValidationException` → `DomainError` → `HttpException` → body-parser client error → `Prisma.PrismaClientKnownRequestError` with a mapped code → unexpected), builds the matching `APIResponse`, logs it, and sends it. Traffic rejected before any handler (non-domain 413 and 429) is only logged as a warning, without Sentry or `error_logs`, so a flood cannot turn each rejected request into a database row and a Sentry event. Never catch exceptions upstream of the filter to build your own response — let them propagate.

## HTTP status mapping — `errors-map.ts`

[errors-map.ts](../../../src/common/presentation/errors-map.ts) maps each domain error class to an `HttpStatus`:

```typescript
export const DOMAIN_ERROR_STATUS_MAP = new Map<
  new (...args: unknown[]) => DomainError,
  HttpStatus
>([
  [UserNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidEmailError, HttpStatus.BAD_REQUEST],
  [DuplicateEmailError, HttpStatus.CONFLICT],
  [InsufficientPermissionsError, HttpStatus.FORBIDDEN],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
]);
```

**Whenever you add a domain error class, add its mapping here in the same change** (plus its translations — see `i18n` skill). Skipping this makes the filter fall through to a generic 500.

## Optional domain error extras

A domain error may expose four optional members that the filter reads:

- `i18nArgs: Record<string, unknown>` — interpolation values passed as `{ args }` when translating its code (`"Quota reached until {resetAt}"`).
- `details: object` — structured data the client needs to act on the error (the conflicting records, the list of rule violations); the filter puts it in the error response's `data`. Never include stack traces, internal identifiers the caller may not see, or personal data the caller is not allowed to read.
- `fieldErrors: { field, code, args?, message }[]` — per-field failures; the filter translates each `code` with its `args` (falling back to `message` without a translation context) and returns `data` as the `details` object plus `errors: [{ field, message }]`. `field` is the path the client can attach the message to (dots for nested objects, `[index]` for array items).
- `retryAt: Date` — the filter sets `Retry-After` (whole seconds from now, never negative) on the response. Use it for 429/503 errors that know when the client may retry.

```typescript
export class OrderQuotaExceededError extends DomainError {
  public constructor(public readonly resetAt: Date) {
    super("The order quota was exceeded", "orders.quota_exceeded");
  }

  public get retryAt(): Date {
    return this.resetAt;
  }

  public get i18nArgs(): Record<string, string> {
    return { resetAt: `${this.resetAt.toISOString().slice(0, 16).replace("T", " ")} UTC` };
  }
}
```

A browser on another origin can only read a response header listed in `CORS_EXPOSED_HEADERS` (`src/common/infrastructure/config/cors-origins.ts`).

## Validation errors

Configured globally in `main.ts` via `app.useGlobalPipes(new TrimPipe(), new I18nValidationPipe({ transform: true }))`. `I18nValidationPipe` extends Nest's `ValidationPipe`; `transform: true` turns bodies and query objects into DTO instances, so `@Type` conversions and DTO field defaults apply (undeclared optional fields exist as `undefined` on the instance, so never spread a DTO over defaults). Everything else keeps Nest's defaults (`whitelist: false`, `forbidNonWhitelisted: false`) — extra fields on a request body that aren't declared on the DTO are **not** stripped or rejected; they pass through untouched to whatever reads the DTO downstream. `TrimPipe` ([trim.pipe.ts](../../../src/common/infrastructure/pipes/trim.pipe.ts)) runs first, recursively trimming string values in `body`/`query`/`param` before validation sees them — register it ahead of the validation pipe so trimmed values are what get validated.

Messages must be set manually per-field with `i18nValidationMessage("namespace.action.field_rule")` — automatic translation is not used (see `i18n` skill for the translation-file side). A failing DTO returns `message` as an array of the translated messages of the top-level properties with `code: "validation_error"`, and `data.errors` as `[{ field, message }]` flattened from every nested child: `field` is the request path (`a.b`, `items[0].name`), one entry per failed constraint. The OpenAPI post-processor documents it through the `FieldError` component referenced by `ErrorResponse.data.errors`.

## Logging

Every HTTP-originated exception is logged three ways:

1. **Console** — immediate, with `traceId`, `path`, `method`, `body`, `query`, `params` for debugging. The exception itself is logged through `describeExceptionForLog` (name, message and stack with emails and JWTs masked); for a validation error only the failing property paths and constraint names are kept, because class-validator errors carry the whole received object (`target`), the rejected `value`, and i18n constraint messages that embed that value.
2. **Database** (`error_logs` table, [error-log.service.ts](../../../src/common/infrastructure/logging/error-log/error-log.service.ts)) — fire-and-forget persistence with exception type/message/stack, sanitized request context (passwords/tokens redacted) in a `jsonb` column, and the authenticated user's ID if present. Retention is 30 days, enforced by [error-log-purge.service.ts](../../../src/common/infrastructure/logging/error-log/error-log-purge.service.ts) — a daily `@Cron` job (`@nestjs/schedule`) that deletes rows whose `occurred_at` is older than `ERROR_LOG_RETENTION_DAYS`; the `occurred_at` index serves both trace lookups and this purge.
3. **Sentry** — `Sentry.captureException(exception, { mechanism: { handled: false, type: "auto.http.nestjs.global_filter" } })` from `@sentry/nestjs`, called from the filter alongside the console log (same `@SkipLogError()` gate — see below), but skipped for `DomainError` instances: a business rule violation (`UserNotFoundError`, `InvalidCredentialsError`, etc.) isn't a bug, so it's still logged to console/database but never reported as a Sentry issue. No-ops if `SENTRY_DSN` is unset (e.g. local dev). The Sentry HTTP integration attaches incoming request bodies to events by default, so `main.ts` calls `registerSentryRedaction()` (`src/common/infrastructure/logging/sentry-redaction.ts`), a global event processor that redacts secrets and masks emails in the request body, query, URL, headers and cookies of every event.

Sentry is initialized in [instrument.ts](../../../src/instrument.ts), imported as the very first line of `main.ts` (`import "@/instrument";`, before every other import). This ordering matters: Sentry's Nest instrumentation patches framework modules the moment they're first loaded, so it has to run before `AppModule` loads anything. Because `ConfigModule` doesn't exist yet at that point, `instrument.ts` gets `SENTRY_DSN`/`NODE_ENV` from `readSentryConfig()` (`src/common/infrastructure/config/sentry-config.ts`, which runs its own `dotenv.config()`) instead of `ConfigService`.

The filter calls `Sentry.captureException` manually rather than Sentry's own `SentryGlobalFilter`/`@SentryExceptionCaptured()` — neither has any concept of `@SkipLogError()`, so either would report every error this codebase explicitly opts out of (e.g. `TokenExpiredError`).

### Opt-out decorators

For exceptions that are routine and don't need monitoring (e.g. expected token expiry), apply to the **error class**:

| Decorator             | Suppresses                    |
| --------------------- | ------------------------------ |
| `@SkipLogError()`     | console logging + Sentry       |
| `@SkipSaveErrorLog()` | database persistence           |

```typescript
@SkipLogError()
@SkipSaveErrorLog()
export class TokenExpiredError extends DomainError {
  /* ... */
}
```

They're independent — apply one, both, or neither. Files: `src/common/presentation/decorators/`.

### Background jobs (cron, event handlers)

`@Cron()`/`@Interval()`/`@Timeout()` (from `@nestjs/schedule`) and `@OnEvent()` (from `@nestjs/event-emitter`) are auto-instrumented by `@sentry/nestjs` (see `node_modules/@sentry/nestjs/build/cjs/integrations/`). Every handler using one of these decorators automatically:

1. Runs inside its own isolated Sentry scope, so its tags/breadcrumbs can't leak into an unrelated HTTP request's error report.
2. Has any thrown or rejected error captured as a Sentry Issue with a full stack trace, then rethrown.

A background job needs **no manual try/catch and no manual `Sentry.captureException()` call** — just let the error propagate. This is default `@sentry/nestjs` behavior, not something configured in this codebase — it only works because `instrument.ts` is preloaded before those decorators' modules load (see above).

**Caveat**: unlike the HTTP path above, this is `@sentry/nestjs`'s own auto-instrumentation, not the filter's manual call — it has no concept of `@SkipLogError()` or the `DomainError` exclusion, so a domain error thrown inside one of these handlers is always reported.

Anything that bypasses these decorators (a raw `setInterval`, a queue consumer not built on `@nestjs/schedule`) gets none of this automatically. Wrap it yourself in `Sentry.withIsolationScope(() => { ... })` if one is ever added.

### Trace IDs

[trace-id.middleware.ts](../../../src/common/presentation/middlewares/trace-id.middleware.ts) reuses an incoming `x-trace-id` header, or `x-request-id` when `x-trace-id` is absent, otherwise assigns a fresh UUID v7 (`req.traceId`), echoing it back under both `x-trace-id` and `x-request-id`. Both headers are in the CORS `allowedHeaders`/`exposedHeaders` lists (`CORS_ALLOWED_HEADERS`/`CORS_EXPOSED_HEADERS` in `cors-origins.ts`).

### Application logger

`main.ts` creates the app with `bufferLogs: true` and installs `AppLogger` ([app-logger.service.ts](../../../src/common/infrastructure/logging/app-logger.service.ts)) with `app.useLogger(...)`. Code keeps using Nest's `Logger` class; `AppLogger` decides the format: in production one JSON line per entry (`level`, `timestamp`, `context`, `message`, `traceId` from `RequestContextService` when inside a request, `stack`, `details`) written to stdout, or stderr for `warn`/`error`/`fatal`; in development Nest's readable console format. Never use `console.*`. It's surfaced in logs and in every `APIResponse` (including error responses) for correlating a client report back to server logs.

## Rules

- Never catch a domain error inside a use case — let it propagate to the filter.
- Never expose stack traces or internal error details in the response body, in any environment; stacks go only to the `error_logs` table and the logs.
- Never log passwords, tokens, other secrets or email addresses. The filter logs request bodies, queries and parameters through `sanitizeBody` (`src/common/presentation/utils/sanitize-body.util.ts`), which walks nested objects and arrays, replaces the value of every key in its sensitive-field set (matched case-insensitively: passwords, password hashes, tokens, ID tokens, credentials, secrets, authorization) and every JWT with `[REDACTED]`, and masks every email address with `[EMAIL]` (`maskEmailAddresses`, `src/common/domain/utils/mask-email-addresses.ts`). A new request field that carries a secret is added to that set in the same change. Never log a raw exception object: use `describeExceptionForLog`.
- New domain error → mapping in `errors-map.ts` → translations, all in the same change.
