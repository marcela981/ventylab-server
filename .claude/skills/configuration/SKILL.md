---
name: configuration
description: Type-safe environment variable configuration (`@nestjs/config` + class-validator) and admin-editable runtime platform settings (code registry with hard limits, DB overrides, hot reload, composition root binding settings ports) for this backend. Trigger on — adding/reading an environment variable, adding or wiring a runtime platform setting, `PlatformSettingsFacade`, the `src/composition/` root (settings ports and other cross-feature ports a feature may not import directly), a settings port read per call, editing `env.validation.ts`, injecting `ConfigService<EnvironmentVariables, ...>`, updating `.env`/`.env.example`, coercing a numeric or boolean env var (`@Type(() => Number)`, `ToBoolean()`), a JSON-valued env var (`@IsJSON()`) parsed into settings, provider API keys or settings that must never reach clients.
---

# Configuration

Environment variables are validated on startup — the app **fails fast** if anything required is missing or malformed, rather than failing at runtime.

## Structure

`src/common/infrastructure/config/env.validation.ts` defines `EnvironmentVariables` with class-validator decorators; `ConfigModule.forRoot({ isGlobal: true, validate })` in `app.module.ts` wires it in globally.

```typescript
export class EnvironmentVariables {
  @IsEnum(Environment)
  public NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Type(() => Number)
  public PORT: number = 3000;

  @IsString()
  public JWT_SECRET: string;

  @IsBoolean()
  @ToBoolean()
  public SOME_FEATURE_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  public SWAGGER_ALLOWED_IPS?: string;
}
```

`SWAGGER_ALLOWED_IPS` (comma-separated, `*` or empty for no restriction) only narrows who reaches the API documentation by source IP; whether the documentation is open is decided by `NODE_ENV` and, in production, an `ADMIN` access token (see the `swagger` skill).

`validate()` runs `plainToInstance` + `validateSync` with no implicit conversion and, if validation fails, throws `Invalid environment configuration:` followed by one `- VARIABLE_NAME: <failed constraints>` line per invalid or missing variable, so boot stops with the variable named. After validation it can also resolve aliases by assigning the canonical field (for example, a legacy alias fills the canonical variable when the canonical one is unset); `ConfigService.get()` returns the validated object, so consumers only ever read the canonical name. Because there's no implicit conversion, **every numeric field needs its own `@Type(() => Number)`** or it fails validation (env vars always arrive as strings).

Booleans need the same treatment, but `@Type(() => Boolean)` doesn't work the way you'd expect (`Boolean("false")` is `true`) — use the project's `ToBoolean()` transform instead:

```typescript
const ToBoolean = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }): unknown => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;

    return value;
  });
```

## Adding a new variable

1. Add the field to `EnvironmentVariables` with the most specific validator available (`@IsEmail()`/`@IsUrl()` over a bare `@IsString()`).
2. Give it a default only if it's genuinely optional in some environment — critical variables (DB URL, JWT secret) must have **no default**, so a missing value fails startup instead of silently degrading.
3. Add it to `.env.example` (committed) with a placeholder/comment.
4. Add the real value to your local `.env` (gitignored, never committed).

## Reading it in code

```typescript
@Injectable()
export class SomeService {
  public constructor(
    private readonly _configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  public doThing(): void {
    const dbUrl: string = this._configService.get("DATABASE_URL", {
      infer: true,
    });
  }
}
```

The second generic (`true`) makes every `.get()` call required/non-undefined — use it unless you're deliberately reading an `@IsOptional()` field, in which case drop the `true` and handle `undefined`:

```typescript
private readonly _configService: ConfigService<EnvironmentVariables>;

const timeout: number = this._configService.get("TIMEOUT") ?? 5000;
```

## Where `process.env` may be read

Only under `src/common/infrastructure/config/`. `env.validation.ts` covers everything read through `ConfigService`. Code that runs before Nest boots (Sentry initialization in `src/instrument.ts`) calls a small reader in the same folder (`readSentryConfig()` in `sentry-config.ts`), which loads `.env` with `dotenv` and reads the variables itself. `grep -rn "process.env" src --include=*.ts | grep -v "src/common/infrastructure/config"` must return nothing.

## Rules

- Never hardcode secrets — always through `ConfigService`.
- Prefer the most specific validator (`@IsUrl({ protocols: ["https"] })` over `@IsString()`).
- Use `@IsOptional()` only for variables with a meaningful absent state (feature flags, credentials not needed in every environment) — not as a shortcut to avoid fixing a missing required value.
- `.env` is gitignored and per-developer; `.env.example` is committed and is the only documentation of what variables exist.
- Structured settings (per-key overrides, tables) are a single JSON-string variable validated with `@IsJSON()` here; the adapter that owns them parses it once at construction, checks the shape (throwing a config error that names the variable and the offending path), and merges it over code defaults, so a malformed value fails startup.
- Settings read from config (API keys, model names, internal limits, prompts) are never returned to clients.

## Runtime platform settings

Operational values an administrator may tune without a restart (limits, intervals, thresholds, toggles) are **platform settings**; secrets (API keys, JWT, passwords, SMTP, storage or broker credentials) never are and stay in the environment only.

- **Registry in code**: the platform-settings feature's domain registry defines every key with its category, form metadata for a generic admin form (value `type` — `integer`, `number`, `boolean`, `string`, `string-list`, `integer-list`, `map` or `object`; `label`, `unit` (nullable) and `description` written in the administrators' language as literals of the registry, never in another language), value validation (type, shape, range or allowed values) and **hard limits** no administrator can exceed; a value outside them is a 422 domain error. Hard limits that already exist as shared domain constants are reused, never copied. A map-like setting (or an object setting with a map field) also declares a `keySchema` — `path` of the map field (null when the whole value is the map), `keyLabel`, `allowedKeys` (null = free keys; keys owned by another feature, such as provider identifiers, come from that feature's domain constants, never retyped), `valueType`, `valueLimits` and `valueKeySchema` for a nested map — so the form can add and remove keys.
- **Validation reasons**: the value reader rejects with a reason code from the registry's reason catalog plus its arguments, never a free-text reason; the error keeps the English reason in its message and exposes `fieldErrors` (`field` = the setting key, followed by the nested path inside the value when the failure is nested, such as `<key>.items[0].name`), which the exception filter translates (`platform-settings.reasons.<code>`) into the response's `data.errors`. Adding a reason means adding the code, its English text and its translations in every language.
- **Defaults**: each key's default is the current environment variable read through the owning feature's pure config reader (`read<Feature>Settings(configService)` in `infrastructure/config/`), or the feature's code constant. Only admin overrides are persisted (one row per key with a `version`); the effective value is `override ?? default`, reported with its origin `DEFAULT | OVERRIDE`.
- **Cache and hot reload**: overrides are loaded into memory on module init (if the table is missing or the database does not answer, a warning is logged and the defaults are served, so the app still boots). An update or reset runs in one transaction under an advisory lock on the key, checks the expected `version` (409 when stale), records the audit entry through `IAuditRecorder`, and after commit updates the cache and notifies `subscribe(key, listener)` subscribers.
- **Consumers never import the settings feature.** A consumer keeps its own settings port (token + interface in `application/tokens/` or `application/ports/`) and reads it **per call**, never copying a value into a field at construction. The composition root (`src/composition/`, a `@Global()` module imported by `app.module.ts`) registers the settings module with its defaults and binds each consumer port to an adapter whose editable fields are getters over `PlatformSettingsFacade.get(key)`; non-editable fields come from the consumer's config reader. A timer whose period is a setting checks the current value on each tick and reschedules itself when it changes.
- **Other composition ports**: the composition root also binds ports that a feature needs from a feature it is not allowed to import (for example a read port over the facade of a feature that only consumes events), each in its own `@Global()` module under `src/composition/` registered in `app.module.ts`, so the settings composition and its spec stay independent of that feature.
- **Adding a setting**: add the key, its value type and its definition (form metadata, key schema for maps, validation + hard limits) to the registry, its default to the composition root's defaults reader, the getter to the consumer adapter, and read it per call in the consumer.
